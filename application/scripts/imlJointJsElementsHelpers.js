function centerAndResizeAttributeViewsOnClass(imlClass,model=imlStructuralModel, paper) {
	imlClass = model.classes.get(imlClass.id);
	const imlClassView = paper.findViewByModel(imlClass);
    const attrPadding = 10;
    const attrHeightOffset = 25;
    const classNamePadding = 15;
	const iconPad = 25;
	// console.log(imlClassView.attr('classNameLabel'));
    var classNameWidth = imlClassView.selectors.classNameLabel.textLength.baseVal.value;
	var maxAttributeNameWidth = getMaxAttributeNameWidth(imlClass, paper) + iconPad;
	
	var resizedAttributeWidth = 0;
    if(classNameWidth > maxAttributeNameWidth) {
        classNameWidth += classNamePadding;
        resizedAttributeWidth = classNameWidth - attrPadding;
        
        imlClassView.model.attributes.attrs.classAttributeRect.width = (classNameWidth);
		imlClassView.resize(imlClassView.model.attributes.attrs.classAttributeRect.height, classNameWidth);
    } else { // maxAttribute is wider
		resizedAttributeWidth = maxAttributeNameWidth;

        imlClassView.model.attributes.attrs.classAttributeRect.width = (maxAttributeNameWidth + attrPadding);
		imlClassView.resize(imlClassView.model.attributes.attrs.classAttributeRect.height, maxAttributeNameWidth + attrPadding);
    }
	
	classNameWidth = imlClassView.selectors.classNameLabel.textLength.baseVal.value + classNamePadding;
	var maxWidth = Math.max(classNameWidth,resizedAttributeWidth);
	imlClassView.model.attributes.attrs.classAttributeRect.width = maxWidth + attrPadding;
    imlClassView.resize(imlClassView.model.attributes.attrs.classAttributeRect.height, maxWidth + attrPadding);

    var attributeCounter = 1;

	
    imlClass.attributes.forEach(attribute => {
        // Get the SVG element from the paper
        const attributeView = attributeViews.get(attribute.id);
        const attributePaperView = paper.findViewByModel(attributeView);
        // Resize each attribute according to class width
        attributePaperView.model.attributes.attrs.attributeRect.width = maxWidth;
		attributeView.resize(maxWidth, attrHeightOffset);
		
        // Center attribute on class
        const centeringOffset = 5;
        attributeView.position( 
                                imlClassView.model.attributes.position.x + centeringOffset, 
                                imlClassView.model.attributes.position.y + (attrHeightOffset * attributeCounter)
                              );
        attributeCounter++;
	});

	
    
	
	// Ensure the embeds array is not undefined. If there are no embeds in the class, the embeds array will not appear in attributes.
	if(imlClassView.model.attributes.embeds) {
		imlClassView.model.attributes.embeds.forEach(obj =>{
			var rel = model.relations.get(obj);
			if (rel)// && (rel.source.localeCompare(rel.destination)==0))
				redrawSelfRelation(imlClass,rel);
		});
	}
	
	//ensure class size matches the attributes rectangle size
	imlClassView.model.attributes.size.height = imlClassView.model.attributes.attrs.classAttributeRect.height;
	imlClassView.model.attributes.size.width = imlClassView.model.attributes.attrs.classAttributeRect.width;
}

//positions the class directly below any class(es) that it overlaps (guarantees a placement)
function findNewPos(graph, element){

	var elementsUnder = graph.findModelsInArea(element.getBBox()).filter(el => el !== element);
	
	while(overlap(elementsUnder)){
		var index = -1;
		for (var i = 0; i < elementsUnder.length; i++){
			if (elementsUnder[i].attributes.type.localeCompare("iml.Class")==0)
				index = i;
		}
		
		var hidden = elementsUnder[index];
		var newX = hidden.attributes.position.x;
		var newY = hidden.attributes.position.y + hidden.attributes.size.height + 20;
		element.position(newX, newY);
		elementsUnder = graph.findModelsInArea(element.getBBox()).filter(el => el !== element);
	}
	
	return { x: newX, y: newY };
}

function getMaxAttributeNameWidth(imlClass, paper) {
    const attrMargin = 10;
    var maxAttributeWidth = 0;

	if (imlClass.attributes){
		imlClass.attributes.forEach(attribute => {
			// Get the SVG element from the paper
			const attributePaperView = paper.findViewByModel(attributeViews.get(attribute.id));
			// Get the length of the attribute text element
			var attributeNameWidth = attributePaperView.selectors.attributeLabel.firstChild.textLength.baseVal.value + attrMargin;
			// Keep track of the largest length
			if(attributeNameWidth > maxAttributeWidth) { maxAttributeWidth = attributeNameWidth; }
		});
		

		return maxAttributeWidth;
	}
	else
		return 0;
}

function getClassWidthNoAttribute(imlClass) {
    var classElementView = paper.findViewByModel(classes.get(imlClass.id));
    classNameWidth = classElementView.selectors.classNameLabel.textLength.baseVal.value + classNamePadding;

    return classNameWidth;
}

function getDefaultValueForType(imlType) {
	if (imlType == ImlType.STRING) {
		return "Enter a value";
	} else if (imlType == ImlType.INTEGER) {
		return "0";
	} else if (imlType == ImlType.DOUBLE) {
		return "0.0";
	}
	// imlType == ImlType.BOOLEAN
	return "FALSE";
}

function moveClassAttributes(graph, element, dx, dy, imlStructuralModel) {

	// var endPosition = element.attributes.position;
	// var dx = endPosition.x - x;
	// var dy = endPosition.y - y;
	// console.log(endPosition, dx, dy);
	
	if (element.attributes.embeds){
		element.attributes.embeds.forEach(item =>{
			var attr = graph.getElements().filter(function(e1){return e1.id==item;});
			if(attr[0]){
				var newPos = { x: attr[0].attributes.position.x-dx, y: attr[0].attributes.position.y-dy}
				attr[0].set('position', newPos);
				if(attr[0].attributes.embeds){
					attr[0].attributes.embeds.forEach(embededItem =>{
						var attribute = graph.getElements().filter(function(e1){return e1.id==embededItem;})[0];
						var link = graph.getLinks().filter(function(e1){return e1.id==embededItem;})[0];
						if(attribute){
							var newPos = { x: attribute.attributes.position.x-dx, y: attribute.attributes.position.y-dy}
							attribute.set('position', newPos);
						}
						else if (link){
							var points = link.attributes.vertices;
							for (var index = 0; index < points.length; index++){
								var newX = points[index].x-dx;
								var newY = points[index].y-dy;
								var newPos = { x: newX, y: newY};
								points[index] = newPos;
							}
							var clone = link.clone();
							var id = link.id;
							var rel = imlStructuralModel.relations.get(id);
							link.remove();
							imlStructuralModel.relations.set(rel.id, rel);
							clone.set('id',id);
							clone.addTo(graph);
							attr[0].embed(clone);
						}
					});
				}
			}
			var link = graph.getLinks().filter(function(e1){return e1.id==item;});
			if(link[0]){
				var points = link[0].attributes.vertices;
				for (var index = 0; index < points.length; index++){
					var newX = points[index].x-dx;
					var newY = points[index].y-dy;
					var newPos = { x: newX, y: newY};
					points[index] = newPos;
				}
				var clone = link[0].clone();
				var id = link[0].id;
				var rel = imlStructuralModel.relations.get(id);
				link[0].remove();
				imlStructuralModel.relations.set(rel.id, rel);
				clone.set('id',id);
				clone.addTo(graph);
				element.embed(clone);
			}
		});
	}
}

// helper function to determine if there are class elements under recently moved class
function overlap(elementsUnder) {
	var overlap = false;
	
	if (elementsUnder.length == 0)
		return overlap;
	
	for (var i = 0; i < elementsUnder.length; i++){
		if (elementsUnder[i].attributes.type.localeCompare("iml.Class")==0)
			overlap = true;
	}
	
	return overlap;
}

function sortAttributeByPosition(imlClass) {
	var attrsArr = new Array();
	imlClass.attributes.forEach(attr => {
		attrsArr[attr.position] = attr;
	});

	var newAttrs = new Map();
	attrsArr.forEach(attr => {
		newAttrs.set(attr.id, attr);
	});
	
	return newAttrs;
}