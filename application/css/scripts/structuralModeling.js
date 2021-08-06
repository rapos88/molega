// The graph contains a reference to all components of your diagram, and the paper is responsible for rendering the graph.
var paper = new joint.dia.Paper;
var graph = new joint.dia.Graph;
var instanceEditor = false;


// The datasets for each type of modeling component.
var imlStructuralModel = new ImlStructuralModel();
var targetMetaModel = new ImlStructuralModel();
var attributes = new Map(); // Allows easy access for editing attributes without going through the IML Class.

// Stores the views of the attributes to access for unhighlight.
var attributeViews = new Map();

// Counts number of classes for unique default names.
var counter = 0;

// Keeps track of information during an add relation event.
var addRelationClickEvent = false;
var addAttributeClickEvent = false;
var addRelationEventTempView;
var addRelationEventTempModel;
var drawTempView;
var drawing = false;
var point = new drawPoint();
var startPos;
var FALSE_VAL;
var TRUE_VAL;

const IMLEmptyValue = "qk1NNAx6NFWcIBfoRcfT";

// Keep track of relation routing mode
var routingMode = 'simpleRoute';

var CTRL_DOWN = false;
var clipboard = [];
var clipboardModel = new Map();
var cutFlag = false;

var undoStack = [];

function uuid(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

window.addEventListener('DOMContentLoaded', () => {
    FALSE_VAL = uuid();
	TRUE_VAL = uuid();
})

$(document).ready(function() {
    implementPaper();
    determineEditMode();
    showModelProperties();
});

$(document).on("keypress", function (e) {
    var focused = $(":focus");
    if(focused[0]) {
        if(focused[0].id.localeCompare("cellInput") == 0 && e.which == 13) {
			document.activeElement.blur();
        }
    }
	
});

$(document).on("keyup", function (e) {
	var focused = $(":focus");
    if(e.which == 46) {
		if (highlightedElement.length > 0){
			var numDel = highlightedElement.length;
			for (var i = highlightedElement.length-1; i > -1; i--){
				if ((focused[0] && focused[0].id.localeCompare("cellInput") != 0) || !focused[0]) {
					var deletedCell = graph.getCell(highlightedElement[i].model.id);
					if(deletedCell){
						if(deleteCell(deletedCell,false))
							showModelProperties();
					}
				}
			}
			undoStack.push(new ImlAction(ImlActionType.DELETE, null, ImlActionTargetType.MULTI, numDel, null));
		}
    }
	if (e.which == 17){
		CTRL_DOWN = false;
	}
});

function removeDuplicates(array) {
  return array.filter((a, b) => array.indexOf(a) === b)
};

function pasteName(copyName, list){
	if (!instanceEditor){
		while (duplicateName(copyName,list)){
			copyName = copyName + "_copy";
		}
	}
	return copyName;
}

function paste(element, targetClasses = []){
	var pasteID = element.model.id;
	var newElement = [];
	show(element);
	var type = element.model.attributes.type;
	if (type.localeCompare("iml.Class")==0){
		
		var origImlClass = clipboardModel.get(element.model.id);
		if (cutFlag){
			var newClass = element.model;
		}
		else{
			var newClass = element.model.clone();	
		}

		var copiedName = pasteName(origImlClass.name,imlStructuralModel.classes);
		graph.addCell(newClass);
		var copyImlClass = new ImlClass (copiedName,new Map(),new Map(),origImlClass.isAbstract,newClass.id);
		if(copyImlClass.isAbstract)
			copiedName = "<< " + copiedName + " >>";
		newClass.attributes.attrs.classNameLabel.text = copiedName;
		
		

		imlStructuralModel.addClass(copyImlClass);

		if (origImlClass.attributes){
			origImlClass.attributes.forEach(origAttr =>{
				var id = origAttr.id;
				if(!cutFlag){
					var clonedAttr = attributeViews.get(id).clone();
					//var clonedAttr = graph.getCell(attr).clone();
					graph.addCell(clonedAttr);
					attributeViews.set(clonedAttr.id, clonedAttr);
					id = clonedAttr.id;
					newClass.embed(clonedAttr);
				}
				var copyAttr = new ImlAttribute(origAttr.visibility, origAttr.name, origAttr.type, origAttr.value, origAttr.position, id, origAttr.lb, origAttr.ub);
				copyImlClass.addAttribute(copyAttr);
				attributes.set(copyAttr.id, copyAttr);
			});
		}
		
		centerAndResizeAttributeViewsOnClass(copyImlClass, imlStructuralModel, paper);
		
		
		var x = element.model.attributes.position.x;
		var y = element.model.attributes.position.y;
		newClass.position(x,y);
		
		var elementsUnder = graph.findModelsInArea(newClass.getBBox()).filter(el => el !== newClass);
		if(cutFlag)
			elementsUnder = elementsUnder.filter(el => el !== element.model);
		
		while(overlap(elementsUnder)){
			x = newClass.attributes.position.x;
			y = newClass.attributes.position.y + newClass.attributes.size.height + 10;
			newClass.position(x,y);
			elementsUnder = graph.findModelsInArea(newClass.getBBox()).filter(el => el !== newClass);
		}
		var dx = newClass.attributes.position.x - element.model.attributes.position.x;
		var dy = newClass.attributes.position.y - element.model.attributes.position.y;
		if (newClass.attributes.embeds){
			newClass.attributes.embeds.forEach(attr =>{
			var orig = graph.getCell(attr);
				if(orig.attributes.type.localeCompare("iml.Attributes")==0){
					var x = orig.attributes.position.x + dx;
					var y = orig.attributes.position.y + dy;
					orig.position(x,y);
				}
			});
		}
		newElement.push(newClass);
		
	}
	else if (type.localeCompare("iml.Attributes")==0){
		var undo = false;
		if(targetClasses.length == 0){
			for (var i = 0; i < highlightedElement.length; i++){
				var targetType = highlightedElement[i].model.attributes.type;
				if (targetType.localeCompare("iml.Class")==0){
					var classView = highlightedElement[i].model;
				}
				else if (targetType.localeCompare("iml.Attributes")==0){
					var classView = highlightedElement[i].model.getParentCell();
				}
				targetClasses.push(classView);
			}
			targetClasses = removeDuplicates(targetClasses);
		}
		else{
			undo = true;
		}
		var clone = element.model.clone();
		
		if(cutFlag){
			graph.removeCells(graph.getElements().filter(function(e1){return e1.id == element.model.id;}));
		}
		
		for (var i = 0; i < targetClasses.length; i++){
			var classView = targetClasses[i];
			var clonedAttr = clone.clone();
			//var imlAttr = attributes.get(element.model.id);
			var imlAttr = clipboardModel.get(element.model.id);
			if(undo){
				clonedAttr.id = pasteID;
				clonedAttr.attributes.id = pasteID;
				element.model.id = 'xxxxxx';
				element.model.attributes.id = 'xxxxxx';
			}
			var targetClass = imlStructuralModel.classes.get(targetClasses[i].attributes.id);
			
			if (undo)
				var newPos = imlAttr.position;
			else
				var newPos = nextPos(targetClass.attributes);//targetClass.attributes.size + 1;
			
			var copiedName = pasteName(imlAttr.name,targetClass.attributes);
			
			var imlClonedAttr = new ImlAttribute(imlAttr.visibility, copiedName, imlAttr.type, imlAttr.value, newPos, clonedAttr.id, imlAttr.lb, imlAttr.ub);
			clonedAttr.attr('attributeLabel/text', imlClonedAttr.print());
			if(undo){
				var newAttrs = new Map();
				var attrPos = 1;
				var added = false;
				targetClass.attributes.forEach(attr =>{
					if(attrPos == newPos){
						newAttrs.set(imlClonedAttr.id, imlClonedAttr);
						attrPos++
						added = true;
					}
					newAttrs.set(attr.id,attr);
					attrPos++;
				});
				if (!added){
					newAttrs.set(imlClonedAttr.id, imlClonedAttr);
				}
				targetClass.attributes = newAttrs;
			}
			else
				targetClass.addAttribute(imlClonedAttr);
			
			graph.addCell(clonedAttr);
			clonedAttr.toFront();
			classView.embed(clonedAttr);
			newElement.push(clonedAttr);
			attributeViews.set(clonedAttr.id, clonedAttr);  // Keeps track of the view
			attributes.set(clonedAttr.id, imlClonedAttr);
			const classAttributeRectHeight = parseInt(classView.attributes.attrs.classAttributeRect.height);
			classView.attributes.attrs.classAttributeRect.height = (classAttributeRectHeight + 25);
			centerAndResizeAttributeViewsOnClass(targetClass, imlStructuralModel, paper);
			
		}
		

	}
	else {
		swal("IML Notification", "IML Relations cannot be pasted.", "info");
	}
	
	var returnArray = [];
	for (var i = 0; i < newElement.length; i++){
		returnArray.push(paper.findViewByModel(newElement[i]));
	}
	return returnArray;
	
	
}

function nextPos(attributes){
	var value = 0;
	attributes.forEach(attr=>{
		if (attr.position > value)
			value = attr.position;
	})
	return value+1;
	
}

function hide(element){
	element.model.attr('./display', 'none');
	if (element.model.attributes.embeds){
		element.model.attributes.embeds.forEach(embed =>{
			graph.getCell(embed).attr('./display', 'none');
		});
	}
}

function show(element){
	element.model.attr('./display', '');
	if (element.model.attributes.embeds){
		element.model.attributes.embeds.forEach(embed =>{
			graph.getCell(embed).attr('./display', '');
		});
	}
}

function copy(isCut){
	cutFlag = isCut;
	clipboard = [];
	for (var i = 0; i < highlightedElement.length; i++){
		clipboard.push(highlightedElement[i]); 
		if (highlightedElement[i].model.attributes.type.localeCompare("iml.Class")==0){
			clipboardModel.set(highlightedElement[i].model.attributes.id, imlStructuralModel.classes.get(highlightedElement[i].model.attributes.id));
		}
		else if (highlightedElement[i].model.attributes.type.localeCompare("iml.Attributes")==0){
			clipboardModel.set(highlightedElement[i].model.attributes.id, attributes.get(highlightedElement[i].model.attributes.id));
		}
		if (isCut){
			hide(highlightedElement[i]);
			if (highlightedElement[i].model.attributes.type.localeCompare("iml.Class")==0){
				clipboardModel.set(highlightedElement[i].model.attributes.id, imlStructuralModel.classes.get(highlightedElement[i].model.attributes.id));
				imlStructuralModel.classes.delete(highlightedElement[i].model.attributes.id);
			}
			else if (highlightedElement[i].model.attributes.type.localeCompare("iml.Attributes")==0){
				const attributeView = highlightedElement[i].model;
				classView = attributeView.getParentCell();
				
				const classAttributeRectHeight = parseInt(classView.attributes.attrs.classAttributeRect.height);
				const classAttributeRectWidth  = parseInt(classView.attributes.attrs.classAttributeRect.width);
				classView.attributes.attrs.classAttributeRect.height = (classAttributeRectHeight - 25);
				classView.resize();
				imlClass = imlStructuralModel.classes.get(classView.id);
				var imlAttribute = imlClass.attributes.get(attributeView.id);
				imlClass.deleteAttribute(imlAttribute);
				centerAndResizeAttributeViewsOnClass(imlClass, imlStructuralModel, paper);
			}
		}
	}
}

function readdClass(oldClass,dropPositionX=100,dropPositionY=100,classHeight=25,classWidth=100) {    
    var newClassName = oldClass.name;
	var imlClassView = new ImlClassElement();
    imlClassView.attr({
        classNameLabel: {
            text: newClassName,
        },
    });

	if(cutFlag){
		graph.removeCells(graph.getCells().filter(el => el.id == oldClass.id)[0]);
	}

	imlClassView.id = oldClass.id;
	imlClassView.attributes.id = oldClass.id;
	imlClassView.attributes.size.height = classHeight;
	imlClassView.attributes.size.width = classWidth;

    var imlClass = new ImlClass(imlClassView.attributes.attrs.classNameLabel.text, oldClass.attributes, oldClass.relationIds, oldClass.isAbstract, oldClass.id);
    imlStructuralModel.addClass(imlClass);
    

    imlClassView.position(dropPositionX, dropPositionY);
    graph.addCell(imlClassView);
	
	
	if(imlClass.attributes){
		imlClass.attributes.forEach(attr =>{
			readdAttribute(attr,imlClassView,imlClass);
		});
	}
	
	if(imlClass.isAbstract === 'true'){
		imlClassView.attributes.attrs.classNameLabel.text = '<< ' + imlClass.name + ' >>';
		imlClassView.attributes.attrs.classAttributeRect.fill = 'rgba(224,224,224,0.6)';
		imlClassView.attributes.attrs.classNameLabel.fontStyle =	'italic';
	}
	else{ 
		imlClassView.attributes.attrs.classNameLabel.text = imlClass.name;
		imlClassView.attributes.attrs.classAttributeRect.fill = 'rgba(204,229,255,1.0)';
		imlClassView.attributes.attrs.classNameLabel.fontStyle =	'normal';
	}
	
	if(instanceEditor)
		dynamicConformance();

	centerAndResizeAttributeViewsOnClass(imlClass, imlStructuralModel, paper);
	
	return imlClassView;
	
}

function setIcon(imlAttribute,imlAttributeView){
	var lb = imlAttribute.lowerBound;
	var ub = imlAttribute.upperBound;
	if(lb == "0"){
		if (ub == "1"){
			imlAttributeView.attr('icon/xlinkHref',  'Resources/optional.png');
		}
		else{
			imlAttributeView.attr('icon/xlinkHref', 'Resources/optionalMultiple.png');
		}
	}
	else{
		if (ub == "1"){
			imlAttributeView.attr('icon/xlinkHref', 'Resources/required.png');
		}
		else{
			imlAttributeView.attr('icon/xlinkHref', 'Resources/requiredMultiple.png');
		}
	}
}

function readdAttribute(imlAttribute, classViewModel, imlClass){

	classViewModel = graph.getCells().filter(el => el.id == classViewModel.id)[0];
	imlClass = imlStructuralModel.classes.get(imlClass.id);
	graph.removeCells(graph.getCells().filter(el => el.id == imlAttribute.id)[0]);
	
	var imlAttributeView = new ImlAttributeElement();
	var pos = imlAttribute.position;
	
	imlAttributeView.id = imlAttribute.id;
	imlAttributeView.attributes.id = imlAttribute.id;
	attributeViews.set(imlAttributeView.id, imlAttributeView);  // Keeps track of the view
    attributes.set(imlAttributeView.id, imlAttribute)           // Keeps track of the model
	
	

	var newAttrs = new Map();
	var addPos = 1;
	var added = false;
	
	if(imlClass.attributes.size < 1){
		newAttrs.set(imlAttribute.id, imlAttribute);
		added = true;
	}
	else{
		imlClass.attributes.forEach(attr =>{
			if (pos < attr.position && !added){
				newAttrs.set(imlAttribute.id,imlAttribute);
				added = true;
			}
			newAttrs.set(attr.id,attr);
		});
	}
	if (!added){
		newAttrs.set(imlAttribute.id,imlAttribute);
	}
	imlClass.attributes = newAttrs;

	
    // Implement view
    const attrHeightOffset = 25;
    
    imlAttributeView.attr({
        attributeRect: {
            ref: 'attributeLabel',
            height: '18.75px',
        },
		icon: {
			image: 'Resources/optional.png',
		},
        attributeLabel: {
            text: imlAttribute.print(),
        }
    });
	setIcon(imlAttribute,imlAttributeView);
	classViewModel.embed(imlAttributeView);     // Sets new attribute as child of the class
    graph.addCell(imlAttributeView);            // Makes the attribute visible
	
    // Update class model height to account for new element
    const classAttributeRectHeight = parseInt(classViewModel.attributes.attrs.classAttributeRect.height);
    classViewModel.attr('classAttributeRect/height' , (classAttributeRectHeight + attrHeightOffset));

    // Rehighlights in case the highlighted element is a class.
    resetHighlights();
	return imlAttributeView;

}

function readdRelation(imlRelation,data){
	relationTempModel = imlRelation;
	if(imlRelation instanceof ImlInheritance){
		relationTempView = new ImlInheritanceElement();	        
	}
	else if(imlRelation instanceof ImlComposition){
		relationTempView = new ImlCompositionElement();
	}
	else if(imlRelation instanceof ImlReference){
		relationTempView = new ImlReferenceElement();
	}
	relationTempView.id = imlRelation.id;
	relationTempView.attributes.id = imlRelation.id;
	relationTempView.source({ id : imlRelation.source });
	relationTempView.target({ id : imlRelation.destination });
	graph.addCell(relationTempView);
	imlStructuralModel.addRelation(relationTempModel);
	
		
	if (relationTempView.attributes.source.id == relationTempView.attributes.target.id){
		imlClassView = graph.getCell(relationTempView.attributes.source.id);		
		imlClassView.embed(relationTempView);
	}
	
	relationTempView.vertices(data.vertices);
	if(!(imlRelation instanceof ImlInheritance))
		relationTempView.labels(data.labels);
}

function undoTableChange(curAction){
	if(curAction.actionTargetType.localeCompare(ImlActionTargetType.CLASS)==0){
		var imlClass = imlStructuralModel.classes.get(curAction.actionTarget.id);
		var property = curAction.previousValue[0].property;
		var value = curAction.previousValue[0].value;
		if (property.localeCompare("Name")==0){
			imlClass.name = value;
			imlClassView = graph.getCell(imlClass.id);
			imlClassView.attributes.attrs.classNameLabel.text = value;
			centerAndResizeAttributeViewsOnClass(imlClass, imlStructuralModel, paper);
			resetHighlights();
		}
		else if (property.localeCompare("Abstract")==0){
			imlClassView = graph.getCell(imlClass.id);
			imlClass.isAbstract = curAction.previousValue[0].value.toLowerCase();
			if(imlClass.isAbstract === 'true'){
				imlClassView.attr('classNameLabel/text','<< ' + imlClass.name + ' >>');
				imlClassView.attr('classAttributeRect/fill','rgba(224,224,224,0.6)');
				imlClassView.attr('classNameLabel/fontStyle','italic');
			}
			else{ 
				imlClassView.attr('classNameLabel/text',imlClass.name);
				imlClassView.attr('classAttributeRect/fill','rgba(204,229,255,1.0)');
				imlClassView.attr('classNameLabel/fontStyle','normal');
			}
			centerAndResizeAttributeViewsOnClass(imlClass, imlStructuralModel, paper);
		}
		
	}
	else if(curAction.actionTargetType.localeCompare(ImlActionTargetType.ATTRIBUTE)==0){
		var imlAttribute = attributes.get(curAction.actionTarget.id);
		for (var i = 0; i < curAction.previousValue.length; i++){
			var property = curAction.previousValue[i].property;
			var value = curAction.previousValue[i].value;
			if (property.localeCompare("Name")==0){
				imlAttribute.name = value;
			}
			else if (property.localeCompare("Value")==0){
				if (IMLEmptyValue != value)
					imlAttribute.value = value;
				else
					imlAttribute.value = "";
			}
			else if (property.localeCompare("Visibility")==0){
				imlAttribute.visibility = value;
			}
			else if (property.localeCompare("Type")==0){
				imlAttribute.type = value;
			}
			else if (property.localeCompare("UpperBound")==0){
				imlAttribute.upperBound = value;
			}
			else if (property.localeCompare("LowerBound")==0){
				imlAttribute.lowerBound = value;
			}
			imlAttributeView = graph.getCell(imlAttribute.id);
			imlAttributeView.attr('attributeLabel/text', imlAttribute.print());
			imlClass = imlStructuralModel.classes.get(imlAttributeView.attributes.parent);
			centerAndResizeAttributeViewsOnClass(imlClass, imlStructuralModel, paper);
		}
		setIcon(imlAttribute,imlAttributeView);
	}
	else if(curAction.actionTargetType.localeCompare(ImlActionTargetType.RELATION)==0){
		var imlRelation = imlStructuralModel.relations.get(curAction.actionTarget.id);
		for (var i = 0; i < curAction.previousValue.length; i++){
			imlRelationView = graph.getCell(imlRelation.id);
			var property = curAction.previousValue[i].property;
			var value = curAction.previousValue[i].value;
			if (property.localeCompare("Name")==0){
				imlRelation.name = value;
			}
			else if (property.localeCompare("UpperBound")==0){
				imlRelation.upperBound = value;
			}
			else if (property.localeCompare("LowerBound")==0){
				imlRelation.lowerBound = value;
			}
			else if (property.localeCompare("Source")==0 || property.localeCompare("Destination")==0){
				if (imlRelation.source.localeCompare(imlRelation.destination)==0){
					imlRelationView.vertices([]);
				}
				imlStructuralModel.classes.forEach(imlClass => {
					if(imlClass.name.localeCompare(value) == 0) {
						var newValue = imlClass.id;
						if(property.localeCompare("Source") == 0) {
							imlRelationView.source({ id: newValue });
							imlRelation.source = newValue;
						} else {
							imlRelationView.target({ id: newValue });
							imlRelation.destination = newValue;
						}
					}
				});
				if (imlRelation.source.localeCompare(imlRelation.destination)==0){
					var imlClass = imlStructuralModel.classes.get(imlRelation.destination);
					redrawSelfRelation(imlClass,imlRelation);
				}
			}
		}
		if(imlRelation instanceof ImlBoundedRelation){
			var d1 = imlRelationView.attributes.labels[0].position.distance;
			var o1 = imlRelationView.attributes.labels[0].position.offset;
			var d2 = imlRelationView.attributes.labels[1].position.distance;
			var o2 = imlRelationView.attributes.labels[1].position.offset;
			imlRelationView.labels([{
				attrs: {
					text: {
						text: imlRelation.name,
					},
				},
				position: {
					distance: d1,
					offset: o1,
				},
			},{
				attrs: {
					text: {
						text: '[' + imlRelation.lowerBound + '..' + imlRelation.upperBound + ']',
					},
				},
				position: {
					distance: d2,
					offset: o2,
				},
			}]);
		}
	}
	else{
		for (var i = 0; i < curAction.previousValue.length; i++){
			var property = curAction.previousValue[i].property;
			var value = curAction.previousValue[i].value;
			if (property.localeCompare("ModelName")==0){
				curAction.actionTarget.name = value;
			}
			else if (property.localeCompare("FileName")==0){
				curAction.actionTarget.fileName = value;
			}
		}
	}
	
	resetHighlights();
	if(highlightedElement[0])
		printProperties(highlightedElement[0]);
	else
		showModelProperties();
}

function undo(){
	var curAction = undoStack.pop();
	
	if(curAction){
		if (curAction.actionType.localeCompare(ImlActionType.ADD)==0){
			clearEmbeds();
			if(curAction.actionTargetType.localeCompare(ImlActionTargetType.CLASS)==0){
				var graphElement = graph.getElements().filter(function(e1){return e1.id==curAction.actionTarget.id;});
				deleteCell(graphElement[0]);
			}
			else if(curAction.actionTargetType.localeCompare(ImlActionTargetType.ATTRIBUTE)==0){
				var graphElement = graph.getElements().filter(function(e1){return e1.id==curAction.actionTarget.id;});
				deleteCell(graphElement[0]);
			}
			else if(curAction.actionTargetType.localeCompare(ImlActionTargetType.RELATION)==0){
				var graphElement = graph.getLinks().filter(function(e1){return e1.id==curAction.actionTarget.id;});
				deleteCell(graphElement[0]);
			}
			undoStack.pop();
		}
		else if (curAction.actionType.localeCompare(ImlActionType.DELETE)==0){
			if(curAction.actionTargetType.localeCompare(ImlActionTargetType.CLASS)==0){
				readdClass(curAction.actionTarget,curAction.previousValue.X,curAction.previousValue.Y,curAction.previousValue.H,curAction.previousValue.W);
				for(var i = 0; i < curAction.previousValue.numRels; i++){
					undo();
				}

				highlightedElement.push(paper.findViewByModel(graph.getCell(curAction.actionTarget.id)));
			}
			else if(curAction.actionTargetType.localeCompare(ImlActionTargetType.ATTRIBUTE)==0){
				readdAttribute(curAction.actionTarget,curAction.previousValue.classViewModel,curAction.previousValue.imlClass);
				centerAndResizeAttributeViewsOnClass(curAction.previousValue.imlClass, imlStructuralModel, paper);
				highlightedElement.push(paper.findViewByModel(graph.getCell(curAction.actionTarget.id)));
			}
			else if(curAction.actionTargetType.localeCompare(ImlActionTargetType.RELATION)==0){
				readdRelation(curAction.actionTarget, curAction.previousValue);
			}
			else if(curAction.actionTargetType.localeCompare(ImlActionTargetType.MULTI)==0){
				clearHighlights();
				clearEmbeds();
				highlightedElement=[];
				for(var i = 0; i < curAction.previousValue; i++){
					undo();
				}
			}			
		}
		else if (curAction.actionType.localeCompare(ImlActionType.TABLE_CHANGE)==0){
			undoTableChange(curAction);
		}
		else if (curAction.actionType.localeCompare(ImlActionType.MENU_CHANGE)==0){
			if(curAction.actionTargetType.localeCompare(ImlActionTargetType.ROUTING)==0){
				$('#routingOptions > li > a').removeClass('selected');
				
				var oldRoute = curAction.previousValue;
				if(oldRoute.localeCompare("simpleRoute")==0){
					undoStack.push(new ImlAction(ImlActionType.MENU_CHANGE, imlStructuralModel, ImlActionTargetType.ROUTING, routingMode, "simpleRoute"));
					simpleRoute();
					$('#simpleRoute').addClass('selected');
				}
				else if(oldRoute.localeCompare("orthogonalRoute")==0){
					orthogonalRoute();
					$('#orthogonalRoute').addClass('selected');
				}
				else if(oldRoute.localeCompare("manhattanRoute")==0){
					manhattanRoute();
					$('#manhattanRoute').addClass('selected');
				}
				else if(oldRoute.localeCompare("metroRoute")==0){
					metroRoute();
					$('#metroRoute').addClass('selected');
				}
				undoStack.pop();
			}
		}
		else if (curAction.actionType.localeCompare(ImlActionType.MOVE)==0){
			if (curAction.actionTargetType.localeCompare(ImlActionTargetType.CLASS)==0){
				clearHighlights();
				var resetPosition = curAction.previousValue;
				var dx = curAction.actionTarget[0].model.attributes.position.x - resetPosition.x;
				var dy = curAction.actionTarget[0].model.attributes.position.y - resetPosition.y;
				clearEmbeds();
				highlightedElement = [];
				for (var i = 0; i < curAction.actionTarget.length; i++){
					var element = graph.getCell(curAction.actionTarget[i].model.id);
					if (element.attributes.type.localeCompare("iml.Attributes")==0){
						element = graph.getCell(element.attributes.parent);
					}
					if (element.attributes.type.localeCompare("iml.Class")==0){
						var newX = element.attributes.position.x - dx;
						var newY = element.attributes.position.y - dy;
						element.position(newX,newY);
						if(element.attributes.embeds){
							element.attributes.embeds.forEach(embed => {
								embed = graph.getCell(embed);
								newX = embed.attributes.position.x - dx;
								newY = embed.attributes.position.y - dy;
								embed.position(newX,newY);
							});
						}
					}
				}
				highlightedElement = curAction.actionTarget;
				resetEmbeds();
			}
			else if (curAction.actionTargetType.localeCompare(ImlActionTargetType.RELATION)==0){
				var link = curAction.actionTarget;
				if (curAction.previousValue[0] == "label"){
					var resetLabels = curAction.previousValue[1];
					link.labels(resetLabels);
				} else {
					var resetVertices = curAction.previousValue[1];
					link.vertices(resetVertices);
				}
			}
		}
		else if (curAction.actionType.localeCompare(ImlActionType.PAPER_CHANGE)==0){
			if (curAction.actionTargetType.localeCompare(ImlActionTargetType.RELATION)==0){
				var imlRelation = imlStructuralModel.relations.get(curAction.actionTarget.id);
				var imlRelationView = graph.getCell(curAction.actionTarget.id);
				if (imlRelation.source.localeCompare(imlRelation.destination)==0){
					imlRelationView.vertices([]);
				}
				var changeTo = curAction.previousValue.end;
				if (changeTo.localeCompare("source")==0){
					imlRelation.source = curAction.previousValue.id;
					imlRelationView.source({ id: curAction.previousValue.id });
					
				}
				else{
					imlRelation.destination = curAction.previousValue.id;
					imlRelationView.target({ id: curAction.previousValue.id });
				}
				if (imlRelation.source.localeCompare(imlRelation.destination)==0){
					var imlClass = imlStructuralModel.classes.get(imlRelation.destination);
					redrawSelfRelation(imlClass,imlRelation);
				}
				imlStructuralModel.classes.get(curAction.newValue.id).relationIds.delete(curAction.actionTarget.id);
			}
		}
		else if (curAction.actionType.localeCompare(ImlActionType.CUT)==0){
			cutFlag = true;
			//callPaste(true);
			var views = curAction.actionTarget.view;
			var model = curAction.actionTarget.model;
			for(var i = 0; i < views.length; i++){
				var curView = views[i];
				var type = curView.model.attributes.type;
				if (type.localeCompare("iml.Class")==0){
					var x = curView.model.attributes.position.x;
					var y = curView.model.attributes.position.y;
					var h = curView.model.attributes.size.height;
					var w = curView.model.attributes.size.width;
					var imlClass = model.get(curView.model.id);
					highlightedElement.push(paper.findViewByModel(readdClass(imlClass,x,y,h,w)));
				}
				else if (type.localeCompare("iml.Attributes")==0){
					var imlAttribute = attributes.get(curView.model.id);
					var imlClass = imlStructuralModel.classes.get(curView.model._previousAttributes.parent);
					var classViewModel = paper.findViewByModel(imlClass).model;
					highlightedElement.push(paper.findViewByModel(readdAttribute(imlAttribute, classViewModel, imlClass)));
					centerAndResizeAttributeViewsOnClass(imlClass, imlStructuralModel, paper);
				}
			}
			clipboard = [];
		}
		else if (curAction.actionType.localeCompare(ImlActionType.PASTE)==0){
			var pasted = curAction.actionTarget;
			cutFlag = curAction.previousValue;
			if (pasted.length > 0){
				for (var i = pasted.length-1; i > -1; i--){
					var deletedCell = graph.getCell(pasted[i].model.id);
					if(deletedCell){
						if(deleteCell(deletedCell,false)){
							showModelProperties();
							undoStack.pop();
						}
					}
				}
			}
			//clipboard = pasted;
		}
		redrawRelations();
		resetHighlights();
		if (instanceEditor)
			dynamicConformance();
	}
}

function callPaste(undo){
	var newHighlight = [];
	for (var i=0; i < clipboard.length; i++){
		var targetClasses = [];
		if (undo)
			targetClasses.push(graph.getCell(clipboard[i].model._previousAttributes.parent));
		
		newHighlight = paste(clipboard[i],targetClasses).concat(newHighlight);
	}
	if(!undo)
		undoStack.push(new ImlAction(ImlActionType.PASTE, newHighlight, ImlActionTargetType.MODEL, cutFlag, null));
	clearEmbeds();
	if(cutFlag){
		cutFlag = false;
	}
	clearHighlights();
	highlightedElement = newHighlight;
	resetHighlights();
	resetEmbeds();
	if(highlightedElement.length == 1)
		printProperties(highlightedElement[0])
	else 
		showModelProperties();
}

$(document).on("keydown", function (e) {
	var focused = $(":focus");

	if (e.which == 17){
		CTRL_DOWN = true;
	}
	if (CTRL_DOWN && e.which == 65){ //CTRL-A SELECT ALL
		if ((focused[0] && focused[0].id.localeCompare("cellInput") != 0) || !focused[0]){ 
			clearEmbeds();
			for (var i = 0; i < highlightedElement.length; i++)
				highlightedElement[i].unhighlight(); 
			highlightedElement = [];
			e.preventDefault();
			paper.findViewsInArea(paper.getArea()).forEach(cell => {
				if(cell.model.attributes.type.localeCompare("iml.Class")==0){
					cell.highlight();
					highlightedElement.push(cell);
				}
			});
			graph.getLinks().forEach(link =>{
				if(link.attributes.source.id.localeCompare(link.attributes.target.id)!=0)
					highlightedElement.push(link.findView(paper));
			});
			if (highlightedElement.length > 1){
				for (var i = 1; i < highlightedElement.length; i++)
					highlightedElement[0].model.embed(highlightedElement[i].model);
			}
			resetHighlights();
			showModelProperties();
		}
	}
	if (CTRL_DOWN && e.which == 90){ // CTRL-Z - UNDO
		if ((focused[0] && focused[0].id.localeCompare("cellInput") != 0) || !focused[0])
			undo();
	}
	if (CTRL_DOWN && e.which == 67){ // CTRL-C - COPY
		if ((focused[0] && focused[0].id.localeCompare("cellInput") != 0) || !focused[0])
			copy(false);
	}
	if (CTRL_DOWN && e.which == 88){ // CTRL-X - CUT
		if ((focused[0] && focused[0].id.localeCompare("cellInput") != 0) || !focused[0]){ 
			copy(true);
			clearEmbeds();
			highlightedElement = [];
		}
		undoStack.push(new ImlAction(ImlActionType.CUT, {view: clipboard, model:clipboardModel}, ImlActionTargetType.MODEL, null, null));
	}
	if (CTRL_DOWN && e.which == 86){ // CTRL-V - PASTE
		if ((focused[0] && focused[0].id.localeCompare("cellInput") != 0) || !focused[0]){ 
			callPaste(false);
		}
	}
	var focused = $(":focus");
	if(e.which == 38) { //UP
        for (var i = 0; i < highlightedElement.length; i++){
			if ((focused[0] && focused[0].id.localeCompare("cellInput") != 0) || !focused[0]) {
				var selectedCell = graph.getCell(highlightedElement[i].model.id);
				if (selectedCell.attributes.type == 'iml.Class'){
					var newPos = { x: selectedCell.attributes.position.x, y: selectedCell.attributes.position.y-1}
					selectedCell.set('position', newPos);
					var elementsUnder = graph.findModelsInArea(selectedCell.getBBox()).filter(el => el !== selectedCell);
					if (overlap(elementsUnder)){
						var newPos = { x: selectedCell.attributes.position.x, y: selectedCell.attributes.position.y+1}
						selectedCell.set('position', newPos);	
					}
					else{
						var embeded = selectedCell.attributes.embeds;
						if (embeded){
							embeded.forEach(item =>{
								var attr = graph.getElements().filter(function(e1){return e1.id==item;});
								if(attr[0]){
									if (attr[0].attributes.type.localeCompare("iml.Class")!=0){
										var newPos = { x: attr[0].attributes.position.x, y: attr[0].attributes.position.y-1}
										attr[0].set('position', newPos);
									}
								}
								var link = graph.getLinks().filter(function(e1){return e1.id==item;});
								if(link[0]){
									var points = link[0].attributes.vertices;
									for (var index = 0; index < points.length; index++){
										var newPos = points[index].y-1;
										points[index].y = newPos;
									}
								}
							})
						}
					}
				}
			}	
		}
    } 
	else if(e.which == 40) { //DOWN
        for (var i = 0; i < highlightedElement.length; i++){
			if ((focused[0] && focused[0].id.localeCompare("cellInput") != 0) || !focused[0]) {
				var selectedCell = graph.getCell(highlightedElement[i].model.id);
				if (selectedCell.attributes.type == 'iml.Class'){
					var newPos = { x: selectedCell.attributes.position.x, y: selectedCell.attributes.position.y+1}
					selectedCell.set('position', newPos);
					
					var elementsUnder = graph.findModelsInArea(selectedCell.getBBox()).filter(el => el !== selectedCell);
					if (overlap(elementsUnder)){
						var newPos = { x: selectedCell.attributes.position.x, y: selectedCell.attributes.position.y-1}
						selectedCell.set('position', newPos);	
					}
					else{
						var embeded = selectedCell.attributes.embeds;
						if (embeded){
							embeded.forEach(item =>{
								var attr = graph.getElements().filter(function(e1){return e1.id==item;});
								if(attr[0]){
									if (attr[0].attributes.type.localeCompare("iml.Class")!=0){
										var newPos = { x: attr[0].attributes.position.x, y: attr[0].attributes.position.y+1}
										attr[0].set('position', newPos);
									}
								}
								var link = graph.getLinks().filter(function(e1){return e1.id==item;});
								if(link[0]){
									var points = link[0].attributes.vertices;
									for (var index = 0; index < points.length; index++){
										var newPos = points[index].y+1;
										points[index].y = newPos;
									}
								}
							})
						}
					}
				}
			}	
		}
    } 
	else if(e.which == 37) { //LEFT
        for (var i = 0; i < highlightedElement.length; i++){
			if ((focused[0] && focused[0].id.localeCompare("cellInput") != 0) || !focused[0]) {
				var selectedCell = graph.getCell(highlightedElement[i].model.id);
				if (selectedCell.attributes.type == 'iml.Class'){
					var newPos = { x: selectedCell.attributes.position.x-1, y: selectedCell.attributes.position.y}
					selectedCell.set('position', newPos);
					var elementsUnder = graph.findModelsInArea(selectedCell.getBBox()).filter(el => el !== selectedCell);
					if (overlap(elementsUnder)){
						var newPos = { x: selectedCell.attributes.position.x+1, y: selectedCell.attributes.position.y}
						selectedCell.set('position', newPos);	
					}
					else{
						var embeded = selectedCell.attributes.embeds;
						if (embeded){
							embeded.forEach(item =>{
								var attr = graph.getElements().filter(function(e1){return e1.id==item;});
								if(attr[0]){
									if (attr[0].attributes.type.localeCompare("iml.Class")!=0){
										var newPos = { x: attr[0].attributes.position.x-1, y: attr[0].attributes.position.y}
										attr[0].set('position', newPos);
									}
								}
								var link = graph.getLinks().filter(function(e1){return e1.id==item;});
								if(link[0]){
									var points = link[0].attributes.vertices;
									for (var index = 0; index < points.length; index++){
										var newPos = points[index].x-1;
										points[index].x = newPos;
									}
								}
							})
						}
					}
				}
			}	
		}
    } 
	else if(e.which == 39) { //RIGHT
        for (var i = 0; i < highlightedElement.length; i++){
			if ((focused[0] && focused[0].id.localeCompare("cellInput") != 0) || !focused[0]) {
				var selectedCell = graph.getCell(highlightedElement[i].model.id);
				if (selectedCell.attributes.type == 'iml.Class'){
					var newPos = { x: selectedCell.attributes.position.x+1, y: selectedCell.attributes.position.y}
					selectedCell.set('position', newPos);
					var elementsUnder = graph.findModelsInArea(selectedCell.getBBox()).filter(el => el !== selectedCell);
					if (overlap(elementsUnder)){
						var newPos = { x: selectedCell.attributes.position.x-1, y: selectedCell.attributes.position.y}
						selectedCell.set('position', newPos);	
					}
					else{
						var embeded = selectedCell.attributes.embeds;
						if (embeded){
							embeded.forEach(item =>{
								var attr = graph.getElements().filter(function(e1){return e1.id==item;});
								if(attr[0]){
									if (attr[0].attributes.type.localeCompare("iml.Class")!=0){
										var newPos = { x: attr[0].attributes.position.x+1, y: attr[0].attributes.position.y}
										attr[0].set('position', newPos);
									}
								}
								var link = graph.getLinks().filter(function(e1){return e1.id==item;});
								if(link[0]){
									var points = link[0].attributes.vertices;
									for (var index = 0; index < points.length; index++){
										var newPos = points[index].x+1;
										points[index].x = newPos;
									}
								}
							})
						}
					}
				}
			}	
		}
	}
})



function determineEditMode(){
			
			var elem = document.getElementById('readMeta');
			if(elem && document.createEvent) {
				var evt = document.createEvent("MouseEvents");
				evt.initEvent("click", true, false);
				elem.dispatchEvent(evt);
			}
			instanceEditor = true;
			$("#check").removeClass("disabled").find("a").attr("onclick", "reportConformance()");
			$("#create").addClass("disabled").find("a").attr("onclick", "return false;");
			$("#conformanceBlock").show();
			$("#conformIcon").show();
			$("#conformIcon").css('background-color', '#5cb85c');
			
}

function clearHighlights(){
	for(var i = 0; i < highlightedElement.length; i++){
		highlightedElement[i].unhighlight();
	}
}

function resetHighlights(){
	for(var i = 0; i < highlightedElement.length; i++){
		highlightedElement[i].unhighlight();
		highlightedElement[i].highlight();
	}
}

function newModel(){
	
	swal({
		  title: "Proceed?",
		  text: 'All unsaved progress on your model will be lost. Do you wish to continue?',
		  icon: "info",
		  buttons: {
				Confirm: {
				  text: "Yes",
				  value: true,
				},
				Deny: {
				  text: "No",
				  value: false,
				}
		  },
		}).then(function(isConfirm) {
			if (isConfirm) {
				graph.removeCells(graph.getElements().filter(function(e1){return e1.attributes.type!="iml.Point";}));
				imlStructuralModel = new ImlStructuralModel();
				targetMetaModel = new ImlStructuralModel();
				determineEditMode();
				showModelProperties();
				routingMode = 'simpleRoute';
				undoStack.push(new ImlAction(ImlActionType.MENU_CHANGE, imlStructuralModel, ImlActionTargetType.ROUTING, routingMode, "simpleRoute"));
				simpleRoute();
				undoStack = [];
				$('#routingOptions > li > a').removeClass('selected');
				$('#simpleRoute').addClass('selected');
			}
			else
				return;
		})
	
}

function dynamicConformance(){
	var report = checkConformance(imlStructuralModel, targetMetaModel);
	if (report == ''){
		$("#conformanceErrors").hide();
		$("#conformIcon").css('background-color', '#5cb85c');
		$("#conformIcon").html('&check;');
		
	}
	else{
		$("#conformanceErrors").html('   Issues:\n<ul>' + report + '</ul>');
		$("#conformanceErrors").show();
		$("#conformIcon").css('background-color', '#d9534f');
		$("#conformIcon").html('&cross;');
	}
}

function reportConformance(){
	var report = checkConformance(imlStructuralModel, targetMetaModel);
	if (report == ''){
		swal({
			title: "Valid Instance",
			text: 'This instance model conforms to ' + imlStructuralModel.conformsTo + ' and is a valid instance model.',
			icon: "success",
			buttons: {
				Confirm: {
				  text: "OK",
				  value: true,
				}
			},
		});
		$("#conformanceErrors").hide();
	}
	else{
		var swalReport = report.replace(new RegExp('<li>', 'g'),' * ');
		swalReport = swalReport.replace(new RegExp('</li>', 'g'), '\n');
		swal({
			title: "Conformance Issues",
			text: 'This instance model does not conform to ' + imlStructuralModel.conformsTo + '; it contains the following issues:\n\n' + swalReport,
			icon: "error",
			className: 'sweetalert-wide',
			buttons: {
				Confirm: {
				  text: "OK",
				  value: true,
				}
			},
		});
		$("#conformanceErrors").html('Issues:\n' + report);
		$("#conformanceErrors").show();
	}
}


function createInstance(){

					instanceEditor = true;
					imlStructuralModel = new ImlStructuralModel();
					addPaletteIcons();
					$("#check").removeClass("disabled").find("a").attr("onclick", "reportConformance()");
					$("#create").addClass("disabled").find("a").attr("onclick", "return false;");
					$("#conformanceBlock").show();
					$("#conformIcon").show();
					$("#conformIcon").css('background-color', '#5cb85c');
					imlStructuralModel.setConformsTo(targetMetaModel.fileName);
					showModelProperties();
					graph.removeCells(graph.getElements().filter(function(e1){return e1.attributes.type!="iml.Point";}));
					undoStack = [];
}

function simpleRoute(){
	graph.getLinks().forEach(link => {
		link.set('router', { name: 'normal' });
	});
	ImlInheritanceElement = joint.dia.Link.define('iml.Inheritance', {
		router: { name: 'normal' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-target" fill="white" stroke="black" d="M 15 -7.5 0 0 15 7.5 15 -7.5"/>', // Change "d" to adjust the arrow-head
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	ImlCompositionElement = joint.dia.Link.define('iml.Composition', {
		router: { name: 'normal' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 15 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 12.5 -7 0 0 12.5 7 25 0 12.5 -7"/>', // Change "d" to adjust the arrow-head
			'<path class="marker-target" fill="none" stroke="black" d="M 15 -7.5 0 0 15 7.5"/>',
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	ImlReferenceElement = joint.dia.Link.define('iml.Reference', {
		router: { name: 'normal' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>', // Change "d" to adjust the arrow-head
			'<path class="marker-target" fill="none" stroke="black" d="M 15 -7.5 0 0 15 7.5"/>',
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	redrawRelations();
	resetHighlights();
	routingMode = 'simpleRoute';
}

function orthogonalRoute(){
	undoStack.push(new ImlAction(ImlActionType.MENU_CHANGE, imlStructuralModel, ImlActionTargetType.ROUTING, routingMode, "orthogonalRoute"));
	graph.getLinks().forEach(link => {
		link.set('router', { name: 'orthogonal' });
	});
	ImlInheritanceElement = joint.dia.Link.define('iml.Inheritance', {
		router: { name: 'orthogonal' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-target" fill="white" stroke="black" d="M 15 -7.5 0 0 15 7.5 15 -7.5"/>', // Change "d" to adjust the arrow-head
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	ImlCompositionElement = joint.dia.Link.define('iml.Composition', {
		router: { name: 'orthogonal' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 15 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 12.5 -7 0 0 12.5 7 25 0 12.5 -7"/>', // Change "d" to adjust the arrow-head
			'<path class="marker-target" fill="none" stroke="black" d="M 15 -7.5 0 0 15 7.5"/>',
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	ImlReferenceElement = joint.dia.Link.define('iml.Reference', {
		router: { name: 'orthogonal' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>', // Change "d" to adjust the arrow-head
			'<path class="marker-target" fill="none" stroke="black" d="M 15 -7.5 0 0 15 7.5"/>',
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	redrawRelations();
	resetHighlights();
	routingMode = 'orthogonalRoute';
}

function manhattanRoute(){
	undoStack.push(new ImlAction(ImlActionType.MENU_CHANGE, imlStructuralModel, ImlActionTargetType.ROUTING, routingMode, "manhattanRoute"));
	graph.getLinks().forEach(link => {
		link.set('router', { name: 'manhattan' });
	});
	ImlInheritanceElement = joint.dia.Link.define('iml.Inheritance', {
		router: { name: 'manhattan' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-target" fill="white" stroke="black" d="M 15 -7.5 0 0 15 7.5 15 -7.5"/>', // Change "d" to adjust the arrow-head
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	ImlCompositionElement = joint.dia.Link.define('iml.Composition', {
		router: { name: 'manhattan' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 15 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 12.5 -7 0 0 12.5 7 25 0 12.5 -7"/>', // Change "d" to adjust the arrow-head
			'<path class="marker-target" fill="none" stroke="black" d="M 15 -7.5 0 0 15 7.5"/>',
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	ImlReferenceElement = joint.dia.Link.define('iml.Reference', {
		router: { name: 'manhattan' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>', // Change "d" to adjust the arrow-head
			'<path class="marker-target" fill="none" stroke="black" d="M 15 -7.5 0 0 15 7.5"/>',
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	redrawRelations();
	resetHighlights();
	routingMode = 'manhattanRoute';
}

function metroRoute(){
	undoStack.push(new ImlAction(ImlActionType.MENU_CHANGE, imlStructuralModel, ImlActionTargetType.ROUTING, routingMode, "metroRoute"));
	graph.getLinks().forEach(link => {
		link.set('router', { name: 'metro' });
	});
	ImlInheritanceElement = joint.dia.Link.define('iml.Inheritance', {
		router: { name: 'metro' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-target" fill="white" stroke="black" d="M 15 -7.5 0 0 15 7.5 15 -7.5"/>', // Change "d" to adjust the arrow-head
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	ImlCompositionElement = joint.dia.Link.define('iml.Composition', {
		router: { name: 'metro' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 15 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 12.5 -7 0 0 12.5 7 25 0 12.5 -7"/>', // Change "d" to adjust the arrow-head
			'<path class="marker-target" fill="none" stroke="black" d="M 15 -7.5 0 0 15 7.5"/>',
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	ImlReferenceElement = joint.dia.Link.define('iml.Reference', {
		router: { name: 'metro' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>', // Change "d" to adjust the arrow-head
			'<path class="marker-target" fill="none" stroke="black" d="M 15 -7.5 0 0 15 7.5"/>',
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	redrawRelations();
	resetHighlights();
	routingMode = 'metroRoute';
}

function findScreenCoords(mouseEvent)
{
  if(drawing){
	  var xpos;
	  var ypos;
	  if (mouseEvent)
	  {
		xpos = mouseEvent.offsetX;
		ypos = mouseEvent.offsetY;
	  }
	  else
	  {
		xpos = window.event.screenX;
		ypos = window.event.screenY;
	  }
	  
	  //offset by 1 in the correct direction so you don't click on the point
	  if (xpos < startPos.x)
		xpos = xpos+1;
	  else
		xpos = xpos-1
	  if (ypos < startPos.y)
		ypos = ypos+1;
	  else
		ypos = ypos-1	  
	  
	  point.position(xpos, ypos);
  }
}
document.getElementById("paperHolder").onmousemove = findScreenCoords;

function showModelProperties(){
	propertiesTableString =    
                                    '<tr>' +
                                        '<td class="propertyTableCell uneditableCell">Model Name</td> <td id="textProperty" class="propertyTableCell editableCell" onclick="edit(this)">' + imlStructuralModel.name + '</td>' +
                                    '</tr>' +
                                    '<tr>' +
                                        '<td class="propertyTableCell uneditableCell">File Name</td> <td id="fileProperty" class="propertyTableCell editableCell" onclick="edit(this)">' + imlStructuralModel.fileName + '</td>' +
                                    '</tr>' +
									'<tr>' +
                                        '<td class="propertyTableCell uneditableCell">Conforms To</td> <td id="conformsProperty" class="propertyTableCell uneditableCell">' + imlStructuralModel.conformsTo + '</td>' +
                                    '</tr>';
        $('#properties').html(propertiesTableString);
}

// Temporary var for saving the clicked on class from the paper.
var highlightedElement = [];

function removeA(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}

function clearEmbeds(){
	for (var i = 0; i < highlightedElement.length; i++){
		var embeds = highlightedElement[i].model.attributes.embeds;
		var newEmbeds = [];
		if(embeds){
			for (var j = 0; j < embeds.length; j++){
				var object = graph.getCell(embeds[j]);
				if (object.attributes.type.localeCompare("iml.Class")==0)
					highlightedElement[i].model.unembed(object);
				if (object.attributes.type.localeCompare("iml.Composition")==0 ||
					object.attributes.type.localeCompare("iml.Inheritance")==0 ||
					object.attributes.type.localeCompare("iml.Reference")==0 ){
						if(object.attributes.source.id.localeCompare(object.attributes.target.id)!=0)
							highlightedElement[i].model.unembed(object);
					}
			}
		}
	}
}

function resetEmbeds(){
	if (highlightedElement.length < 1){
		return;
	}
	else{
		if (highlightedElement[0].model.attributes.type.localeCompare("iml.Class")!=0){
			var index = -1
			for (var i = 0; i < highlightedElement.length; i++){
				if (highlightedElement[i].model.attributes.type.localeCompare("iml.Class")==0){
					index = i;
				}
			}
			if (index != -1)
				highlightedElement.unshift(highlightedElement.splice(index,1)[0]);
			else
				return;
		}
		for (var i = 1; i < highlightedElement.length; i++){
			if(highlightedElement[i].model.attributes.type.localeCompare("iml.Attributes")!=0)
				highlightedElement[0].model.embed(highlightedElement[i].model);
		}
	}
	
}

function implementPaper() {
    $('#routingOptions > li > a').click(function(e){
		$('#routingOptions > li > a').removeClass('selected');
		$(this).addClass('selected'); 
	});
	paper = new joint.dia.Paper({
        el          :       $("#paperHolder"),              // Adds the paper to an element in the DOM.
        model       :       graph,                          // Adds the graph to the paper.
        height      :       null,                           // Allows CSS to control height of paper
        width       :       null,                           // Allows CSS to control width of paper
        gridSize    :       1,
        interactive:    { 
                            vertexAdd: true,               // Disables default vertexAdd interaction
                            linkMove: true,                 
                            stopDelegation: false,          // Allows parents to be dragged by child elements
                        },
		restrictTranslate: true,
    });
    paper.scaleContentToFit({ margin: 10 });

    /**
     *  Zoom paper in/out when the cursor is over a blank area.
     */
    paper.on('blank:mousewheel', function(evt, x, y, delta) {
        zoomPaper(delta, paper, .7, 2.0);
    });
	
	/**
     *  If a class overlaps when moved, rever to previous position
     */
	paper.on({
		'element:pointerdown': (elementView, evt) => {
			var { model: element } = elementView;
			if(element.getParentCell())
				element = element.getParentCell();
			// store the position before the user starts dragging
			evt.data = { startPosition: element.attributes.position };
		},
		'element:pointerup': (elementView, evt) => {
			var endPosition = evt.data.startPosition;
			for (var index = 0; index < highlightedElement.length; index++){
				var { model: element } = highlightedElement[index];//elementView;
				
				const { model: graph } = paper;
				
				if(element.attributes.type.localeCompare("iml.Class")!=0)
				//if(element.getParentCell())
					element = element.getParentCell();
				
				const elementsUnder = graph.findModelsInArea(element.getBBox()).filter(el => el !== element);
				
				
				
				
				endPosition = element.attributes.position;
				
				if (overlap(elementsUnder)) {
					// an overlap found, revert the position
					const { x, y } = findNewPos(graph, element);
					var dx = endPosition.x - x;
					var dy = endPosition.y - y;
					
					if (element.attributes.embeds){
						moveClassAttributes(graph, element, dx, dy, imlStructuralModel);
					}
					
					element.position(x, y);
					endPosition.x = x;
					endPosition.y = y;
					
				}
			}
			var { model: curElement } = elementView;
			if(curElement.getParentCell())
				curElement = curElement.getParentCell();
			
			var dx = curElement.attributes.position.x - evt.data.startPosition.x;
			var dy = curElement.attributes.position.y - evt.data.startPosition.y;
			
			if(dx != 0 || dy !=0){
				var movedElements = [];
				for (var i = 0; i < highlightedElement.length;i++)
					movedElements.push(highlightedElement[i]);
				undoStack.push(new ImlAction(ImlActionType.MOVE, movedElements, ImlActionTargetType.CLASS, evt.data.startPosition, endPosition));
			}
		}
	});
    
    /**
     *  Unhighlights previously selected. Sets properties table to null.
     */
    paper.on('blank:pointerdown', function(evt, x, y) { 
        clearEmbeds();
		
		if(highlightedElement.length != 0) {
			for (var i = 0; i < highlightedElement.length; i++)
				highlightedElement[i].unhighlight(); 
            highlightedElement = [];
        }
        
		
		
        addRelationClickEvent = false;
		addAttributeClickEvent = false;
        addRelationEventTempView = undefined;
        addRelationEventTempModel = undefined;
        $(".paletteIcon").css('outline-style', 'none');     // Unhighlights the relation icon
		showModelProperties();                         // Clears property table
		
		if (drawing){
			graph.removeCells(graph.getCell(drawTempView.id));
			drawing = false;
		}
        // Records the pointer position for dragging the paper
        pointerStart = { 'x': x, 'y': y }
    });

    var pointerStart;
    /**
     *  Drag paper according to the current position of the cursor
     *  and a recorded start point of the cursor.
     */
    paper.on('blank:pointermove', function(evt, x, y) {

		dragPaper(paper, $('#paperHolder'), x, y, pointerStart);
		
    });

    /**
     *  Set cursor back to default after drag has finished.
     */
    paper.on('blank:pointerup', function(evt, x, y) { 
        
        $('#paperHolder').css('cursor', 'default');

    });

    /**
     *  Zoom paper in/out when the cursor is over a cell.
     */
    paper.on('cell:mousewheel', function(cellView, evt, x, y, delta) {
        zoomPaper(delta, paper, .7, 2.0);
    });

    /**
     *  Defines functionality for when a cell is clicked.
     */
    paper.on('cell:pointerdown', 
        function(cellView, evt) {

            // Unhighlights previously selected
            if(!CTRL_DOWN && !highlightedElement.includes(cellView)){
					clearEmbeds();
					for (var i = 0; i < highlightedElement.length; i++)
						highlightedElement[i].unhighlight(); 
					highlightedElement = [];
			}
            try {
                if (addAttributeClickEvent){ //if we have an event to add an attribute
                    addRelationClickEvent = false;
					//find the right attribute and class
					var attributeView = attributeViews.get(cellView.model.id);
                    var imlClass = imlStructuralModel.classes.get(cellView.model.id);
					
					
					if (attributeView){
						var imlClass = imlStructuralModel.classes.get(attributeView.attributes.parent);
					} else if(!imlClass){
						throw new Error("Attributes can only be added to IML Classes.");
					}
					
					var classViewModel = paper.findViewByModel(imlClass).model;
					
					//add the attribute to the class
					newAttribute(classViewModel, imlClass);
					
					//clear selections 
					addAttributeClickEvent = false;
					$(".paletteIcon").css('outline-style', 'none');     // Unhighlights the relation icon
					
                } else if (addRelationClickEvent) { // The relation model is update in addRelationToGraph
					addRel(cellView);
                } else {
					cellView.unhighlight();
					clearEmbeds();
						
                    if(highlightedElement.includes(cellView) && CTRL_DOWN){
						removeA(highlightedElement, cellView);
					}
					else if (!highlightedElement.includes(cellView)){
						if (highlightedElement.length == 0){
							highlightedElement.push(cellView);
						}
						else if (highlightedElement.length > 0){
							if (highlightedElement[0].model.attributes.type.localeCompare("iml.Class")!=0 && cellView.model.attributes.type.localeCompare("iml.Class")==0){
								unhighlightAttributes(cellView);
								highlightedElement.unshift(cellView);
								resetHighlights();
							}
							else{
								var parentSelected = false;
								var attributeView = attributeViews.get(cellView.model.id);
								var classView = paper.findViewByModel(imlStructuralModel.classes.get(cellView.model.id));
								if (attributeView){
									var imlClass = imlStructuralModel.classes.get(attributeView.attributes.parent);
									var classView = paper.findViewByModel(imlClass);
									if(highlightedElement.includes(classView))
										parentSelected = true;
									if(!parentSelected)
										highlightedElement.push(cellView);
								}
								else if(classView){
									unhighlightAttributes(classView);
									highlightedElement.push(classView);
									resetHighlights();
								}
								else{
									highlightedElement.push(cellView);
									resetHighlights();
								}
								
							}
						}
                    }
					resetEmbeds();
					resetHighlights();
					if (highlightedElement.length == 1)
						printProperties(highlightedElement[0]);
					else
						showModelProperties();
                }
            } catch(error) {
                var msg = error.toString();
				msg = msg.replace("Error: ", "");
				swal("IML Error", msg, "error");
				addRelationClickEvent = false;
				addAttributeClickEvent = false;
                addRelationEventTempView = undefined;
                addRelationEventTempModel = undefined;
				if (drawing){
					graph.removeCells(graph.getCell(drawTempView.id));
					drawing = false;
				}
                $(".paletteIcon").css('outline-style', 'none');     // Unhighlights the relation icon
            }
        }
    );
	var startVertices;
	var startLabels;
	paper.on('link:pointerdown', function(cellView) {
		var imlRelationView = graph.getCell(cellView.model.id);
		startVertices = imlRelationView.attributes.vertices;
		startLabels = imlRelationView.attributes.labels;
	});
	paper.on('link:pointerup', function(cellView) {
	try{
		var imlRelation = imlStructuralModel.relations.get(cellView.model.id);
		var imlRelationView = graph.getCell(cellView.model.id);
		var endVertices  = imlRelationView.attributes.vertices;
		var endLabels = imlRelationView.attributes.labels;
		
		if(!(startLabels === endLabels)) {
			undoStack.push(new ImlAction(ImlActionType.MOVE, imlRelationView, ImlActionTargetType.RELATION, ["label", startLabels], endLabels));
		}
		else if(startVertices || endVertices){
			if (!startVertices){
				startVertices = [];
			}
			if (!endVertices){
				endVertices = [];
			}
			if (!(startVertices === endVertices))
				undoStack.push(new ImlAction(ImlActionType.MOVE, imlRelationView, ImlActionTargetType.RELATION, ["point", startVertices], endVertices));
		}
		if (imlRelation){
			
			if(cellView.model.attributes.source.id != undefined) {
				// If the source is an element, then it will have a source.id.
				if(cellView.model.attributes.source.id.localeCompare(imlRelation.source) != 0) { 
					checkNewSource(cellView);
				}
			} else { // New source is a point so reset
				imlRelationView.source({ id : imlRelation.source });
			}
  									

			if(cellView.model.attributes.target.id != undefined) {
				if(cellView.model.attributes.target.id.localeCompare(imlRelation.destination) != 0) {
					checkNewDestination(cellView);
				}
			} else { // New target is a point so reset
				imlRelationView.target({ id : imlRelation.destination });
			}
			

			
			if(imlRelation instanceof ImlBoundedRelation){

				
				if(!instanceEditor){
					
					var d1 = imlRelationView.labels()[0].position.distance;
					var o1 = imlRelationView.labels()[0].position.offset;
					var d2 = imlRelationView.labels()[1].position.distance;
					var o2 = imlRelationView.labels()[1].position.offset;
					if(o1 > 100)
						o1 = 100;
					else if (o1 < -100)
						o1 = -100;

					if(o2 > 100)
						o2 = 100;
					else if (o2 < -100)
						o2 = -100;
					imlRelationView.labels([{
						attrs: {
							text: {
								text: imlRelation.name,
							},
						},
						position: {
							distance: d1,
							offset: o1,
						},
					},{
						attrs: {
							text: {
								text: '[' + imlRelation.lowerBound + '..' + imlRelation.upperBound + ']',
							},
						},
						position: {
							distance: d2,
							offset: o2,
						},
					}]);
					}
				else{
					var d1 = imlRelationView.labels()[0].position.distance;
					var o1 = imlRelationView.labels()[0].position.offset;
					if(o1 > 100)
						o1 = 100;
					else if (o1 < -100)
						o1 = -100;

					imlRelationView.labels([{
						attrs: {
							text: {
								text: imlRelation.name,
							},
						},
	   
						position: {
							distance: d1,
							offset: o1,
						},
					}]);
				}
			}
   
			if(highlightedElement.length == 1){
				printProperties(highlightedElement[0]);
			}
			resetHighlights();
			if(instanceEditor)
				dynamicConformance();
		}
					
						
	} catch(error){
		var msg = error.toString();
		msg = msg.replace("Error: ", "");
        swal("IML Error", msg, "error");
		if(imlRelation){
			imlRelationView.source({ id : imlRelation.source });
			imlRelationView.target({ id : imlRelation.destination });
			redrawRelations();
		}
	}
    });

	graph.on('change:position', function(cell) {
		
		redrawRelations();
		resetHighlights();
	});

    /**
     *  Removes elements from the backend if they are deleted.
     */
    graph.on('remove', function(cell) {
        
        var imlRelation = imlStructuralModel.relations.get(cell.id);
        if (imlRelation) {
            imlStructuralModel.relations.delete(imlRelation.id);
        }
    });
	graph.addCell(point);	
}

function unhighlightAttributes(classView){
	if(classView.model.attributes.embeds){
		classView.model.attributes.embeds.forEach(embed =>{
			var attributeView = paper.findViewByModel(attributeViews.get(embed));
			attributeView.unhighlight();
			removeA(highlightedElement,attributeView);
		});
	}
	
}


/**
 * Returns determines if the proposed name is unique within the specified class
 * 
 * @param {HtmlElement} imlClass 
 * @param {HtmlElement} name 
 */
function uniqueAttributeName(imlClass, name, forward=true, backward=true, modelRel=null){
	var unique = true;
	imlClass.attributes.forEach(attribute =>{
		if (attribute.name == name)
			unique = false;
	});
	imlClass.relationIds.forEach(relId =>{
		var relation = imlStructuralModel.relations.get(relId);
		if (!(relation instanceof ImlInheritance) && relation.source == imlClass.id){
			if (relation.name == name){
				
				if(modelRel){
					if (relation.id != modelRel.id)
						unique=false;
				}else{
					unique = false;
				}
			}
		}
		
	});
	imlClass.relationIds.forEach(rel =>{
		var relation = imlStructuralModel.relations.get(rel);
		if (relation instanceof ImlInheritance){
			var match = false;
			if(modelRel){
				if (relation.id == modelRel.id)
					match = true;
			}
			if(relation.destination != imlClass.id && forward && !match){
				var inheritClass = imlStructuralModel.classes.get(relation.destination);
				unique = unique && uniqueAttributeName(inheritClass, name, true, false,modelRel);
			}
			if(relation.source != imlClass.id && backward && !match){
				var inheritClass = imlStructuralModel.classes.get(relation.source);
				unique = unique && uniqueAttributeName(inheritClass, name, false, true,modelRel);
			}
		}
	});
	return unique;
}

function addRel(cellView){
	if(addRelationEventTempModel.source == "") {

		var sourceClassId = undefined;
		var attributeView = attributeViews.get(cellView.model.id);
		var classModel = imlStructuralModel.classes.get(cellView.model.id);
		
		// Check if the arrowhead was placed on an attribute of a class
		if(attributeView) {
			sourceClassId = attributeView.attributes.parent;    // Sets the target id to the parent in the view
		} else if(classModel) {
			sourceClassId = classModel.id;
		} else {
			throw new Error("Invalid element");
		}
		drawing = true;
		startPos = graph.getCell(sourceClassId).attributes.position;
		point.position(startPos.x,startPos.y);
		addRelationEventTempView.source( { id: sourceClassId });
		addRelationEventTempModel.source = addRelationEventTempView.attributes.source.id;       // Updates the relation model
		drawTempView.source( { id: sourceClassId });
		drawTempView.target( { id: point.id });
		graph.addCell(drawTempView);
	} else if (addRelationEventTempModel.destination == "") {
		
		// Helper method also found in the drop event
		var valid = checkTarget(cellView);

		if (valid)
			addRelationToGraph(); // Uses the global temp vars so nothing needs to be passed
		// The relation model is update in addRelationToGraph
	}
}



/**
 * Returns determines if the proposed name is unique for a class
 * 
 * @param {HtmlElement} name 
 */
function uniqueClassName(name){
	var notFound = true;
	imlStructuralModel.classes.forEach(candidateClass =>{
		if (candidateClass.name == name)
			notFound = false;
	});
	return notFound;
}

/**
 * Returns the first unique generic name for an attribute within a class
 * 
 * @param {HtmlElement} imlClass 
 */
function unusedClassName(){
	var i;
	for (i = 1; i <= (imlStructuralModel.classes.size); i++){
		var tempName = "NewClass" + i;
		if (uniqueClassName(tempName))
			break;
	}
	return "NewClass" + i;
}


/**
 * Returns the first unique generic name for an attribute within a class
 * 
 * @param {HtmlElement} imlClass 
 */
function unusedName(imlClass){
	var i = 1;
	while(true){
		var tempName = "newAttr" + i;
		if (uniqueAttributeName(imlClass, tempName))
			break;
		i++;
	}
	return "newAttr" + i;
}

function unusedRelation(imlClass){
	var i = 1;
	var found = false;
	
	while (!found){
		var candidateName = 'newRelation' + i;
		if (!duplicateRelation(candidateName, imlClass, imlStructuralModel.relations) && !duplicateName(candidateName,imlClass.attributes))
			found = true;
		
		if (!uniqueAttributeName(imlClass, candidateName))
			found = false;
		
		i++;
	}
	return candidateName;
}

/**
 * Adds a new attribute to a class.
 * 
 * @param {HtmlElement} classViewModel 
 * @param {HtmlElement} imlClass 
 */
function newAttribute(classViewModel, imlClass){
	
	var imlAttributeView = new ImlAttributeElement();
	var imlAttribute = new ImlAttribute(
                                        ImlVisibilityType.PUBLIC, 
                                        unusedName(imlClass), 
                                        ImlType.STRING, 
                                        "",
                                        (nextPos(imlClass.attributes)),
                                        imlAttributeView.id
                                       );
    imlClass.addAttribute(imlAttribute);
    attributeViews.set(imlAttributeView.id, imlAttributeView);  // Keeps track of the view
    attributes.set(imlAttributeView.id, imlAttribute)           // Keeps track of the model

    // Implement view
    const attrHeightOffset = 25;
    
    imlAttributeView.attr({
        attributeRect: {
            ref: 'attributeLabel',
            height: '18.75px',
        },
		icon: {
			image: 'Resources/optional.png',
		},
        attributeLabel: {
            text: imlAttribute.print(),
        }
    });
	
	
    classViewModel.embed(imlAttributeView);     // Sets new attribute as child of the class
    graph.addCell(imlAttributeView);            // Makes the attribute visible

	

    // Update class model height to account for new element
    const classAttributeRectHeight = parseInt(classViewModel.attributes.attrs.classAttributeRect.height);
    classViewModel.attributes.attrs.classAttributeRect.height = (classAttributeRectHeight + attrHeightOffset);
	
    centerAndResizeAttributeViewsOnClass(imlClass, imlStructuralModel, paper);


    // Rehighlights in case the highlighted element is a class.
    resetHighlights();
	
	undoStack.push(new ImlAction(ImlActionType.ADD, imlAttribute, ImlActionTargetType.ATTRIBUTE, null, null));
}

/**
 * Adds an element to a class given the HtmlElement of that class.
 * 
 * @param {HtmlElement} classDOMView 
 */

function addAttributeToClass(classDOMView) {
	try{
		var classView = paper.findView(classDOMView);
		if (classView)
			var classViewModel = paper.findView(classDOMView).model;
		else
			throw new Error("Attributes can only be added to IML Classes.");
		var relations = imlStructuralModel.relations;
		// Check if the classDOMView is an attribute
		if(attributes.get(classViewModel.attributes.id)) {
			classViewModel = graph.getCell(classViewModel.attributes.parent);
		}
		else if (relations.get(classViewModel.attributes.id)){
			throw new Error("Attributes can only be added to IML Classes.");
		}

		// Implement attribute model (backend)
		var imlClass = imlStructuralModel.classes.get(classViewModel.attributes.id);
		
        newAttribute(classViewModel, imlClass);
        redrawRelations();
		resetHighlights();
    } catch (error){
		var msg = error.toString();
		msg = msg.replace("Error: ", "");
        swal("IML Error", msg, "error");
	}
}

/**
 * Creates and adds a class to the paper at a given position. Defaults to X:200, Y:150.
 * 
 * @param {number} dropPositionX 
 * @param {number} dropPositionY 
 */
function addClassModelToGraph(dropPositionX = 100, dropPositionY = 100) {    
    const classHeight = 25;
	const classWidth = 100;
	var newClassName = unusedClassName();
	var imlClassView = new ImlClassElement();
    imlClassView.attr({
        classNameLabel: {
            text: newClassName,
        },
    });
	
	imlClassView.attributes.size.height = classHeight;
	imlClassView.attributes.size.width = classWidth;

    var imlClass = new ImlClass(imlClassView.attributes.attrs.classNameLabel.text, new Map(), new Map(), false, imlClassView.id);
    imlStructuralModel.addClass(imlClass);
    

    // Account for the current translate
    dropPositionX -= paper.options.origin.x;
    dropPositionY -= paper.options.origin.y;

    // Account for the current zoom
    dropPositionX = dropPositionX / paper.scale().sx;
    dropPositionY = dropPositionY / paper.scale().sy;

    imlClassView.position(dropPositionX, dropPositionY);
    graph.addCell(imlClassView);
	
	var elementsUnder = graph.findModelsInArea(imlClassView.getBBox()).filter(el => el !== imlClassView);
	while (elementsUnder.length > 0){
		var oldPos = imlClassView.position();
		oldPos.y += 20;
		imlClassView.position(oldPos.x,oldPos.y);
		elementsUnder = graph.findModelsInArea(imlClassView.getBBox()).filter(el => el !== imlClassView);
	}
	
		
	if(instanceEditor)
		dynamicConformance();

	centerAndResizeAttributeViewsOnClass(imlClass, imlStructuralModel, paper);
	
	undoStack.push(new ImlAction(ImlActionType.ADD, imlClass, ImlActionTargetType.CLASS, null, null));
}

/**
 * Triggers an event to add an composition relation by dragging and dropping
 * 
 * @param {HtmlElement} domView
 */
function addCompositionToGraph(domView) {
    try { 
		addRelationEventTempView = new ImlCompositionElement();
        addRelationEventTempModel = new ImlComposition("", "", "", 0, 1, addRelationEventTempView.id);
		drawTempView = new ImlCompositionElement();
        elementViewModel = paper.findView(domView);
		addRelationClickEvent = true;
		addRel(elementViewModel);
    } catch(error) {
        $(".paletteIcon").css('outline-style', 'none'); 
    }
}

/**
 * Adds a relation to the graph after an add relation event has been completed. Uses global temp vars therefore no,
 * parameters are required.
 * 
 */
function addRelationToGraph() {
	
    addRelationEventTempModel.destination = addRelationEventTempView.attributes.target.id;  // Update relation model
    imlStructuralModel.addRelation(addRelationEventTempModel);
    imlStructuralModel.relations.set(addRelationEventTempModel.id, addRelationEventTempModel);
    graph.addCell(addRelationEventTempView);                                                // Update relation view
	
	undoStack.push(new ImlAction(ImlActionType.ADD, addRelationEventTempModel, ImlActionTargetType.RELATION, null, null));
	
    if(!(addRelationEventTempModel instanceof ImlInheritance)) {
        if (!addRelationEventTempModel.name)
			addRelationEventTempModel.name = unusedRelation(imlStructuralModel.classes.get(addRelationEventTempModel.source));
        var link = graph.getCell(addRelationEventTempModel.id);
		
		
		
		if (link.attributes.source.id == link.attributes.target.id){
			imlClassView = graph.getCell(link.attributes.source.id);
			
			var classX = imlClassView.position().x;
			var classY = imlClassView.position().y;
			var width = imlClassView.attributes.attrs.classAttributeRect.width;
			var height = imlClassView.attributes.attrs.classAttributeRect.height;
			
			link.vertices([
				new g.Point(classX+(parseFloat(width)/2), classY-40),
				new g.Point(classX-60, classY-40),
				new g.Point(classX-60, classY+(parseFloat(height)/2))
			]);
			
			
			imlClassView.embed(link);
		}
		if(!instanceEditor){
			link.labels([{
				attrs: {
					text: {
						text: addRelationEventTempModel.name,
					},
				},
				position: {
					distance: .33,
					offset: -15,
				},
			},{
				attrs: {
					text: {
						text: '[' + addRelationEventTempModel.lowerBound + '..' + addRelationEventTempModel.upperBound + ']',
					},
				},
				position: {
					distance: .9,
					offset: 20,
				},
			}]);
		} else {
			link.labels([{
				attrs: {
					text: {
						text: addRelationEventTempModel.name,
					},
				},
				position: {
					distance: .33,
					offset: -15,
				},
			},{
				attrs: {
					text: {
						text: '',
					},
				},
				position: {
					distance: 0,
					offset: 0,
				},
			}]);
		}
    }
	if(instanceEditor)
		dynamicConformance();
    addRelationClickEvent = false;
	addAttributeClickEvent = false;
    addRelationEventTempView = undefined;
    addRelationEventTempModel = undefined;
    $(".paletteIcon").css('outline-style', 'none');     // Unhighlights the relation icon
	if (drawing){
		graph.removeCells(graph.getCell(drawTempView.id));
		drawing = false;
	}
}

function generateCode() {
	// If in instance editor and instance does not conform
	if(instanceEditor && $("#conformanceErrors").is(":visible")) { // Then don't generate.
		swal("IML Error", "The instance model must conform to its metamodel before source code can be generated.", "error");
	} else { // Otherwise, generate.
		
		swal("Kaylynn needs to implement this.");
		/*var classFiles;
		classFiles = generateJavaCode(imlStructuralModel, targetMetaModel, instanceEditor);
		classFiles.generateAsync({type:'blob'})
		.then(function(content) {
			// Force down of the Zip file
			saveAs(content, imlStructuralModel.name + '.zip');
		});*/
	}
}


/**
 * Triggers an event to add an reference relation by dragging and dropping
 * 
 * @param {HtmlElement} domView
 */
function addInheritanceToGraph(domView) {
	
    try { 
		addRelationEventTempView = new ImlInheritanceElement();
        addRelationEventTempModel = new ImlInheritance("", "", addRelationEventTempView.id);
		drawTempView = new ImlInheritanceElement();
        elementViewModel = paper.findView(domView);
		addRelationClickEvent = true;
		addRel(elementViewModel);
    } catch(error) {
        $(".paletteIcon").css('outline-style', 'none'); 
    }
}

/**
 * Triggers an event to add an inheritance relation by dragging and dropping
 * 
 * @param {HtmlElement} domView
 */
function addReferenceToGraph(domView) {
        try { 
		addRelationEventTempView = new ImlReferenceElement();
        addRelationEventTempModel = new ImlReference("", "", "", 0, 1, addRelationEventTempView.id);
		drawTempView = new ImlReferenceElement();
        elementViewModel = paper.findView(domView);
		addRelationClickEvent = true;
		addRel(elementViewModel);
    } catch(error) {
        $(".paletteIcon").css('outline-style', 'none'); 
    }
}

/**
 * Triggers an event to add a relation by clicks
 * 
 * This method is generic because the type of icon clicked will determine the correct relation.
 * 
 * @param {HtmlElement} domView
 */
function addRelationToGraphClickEvent(domIcon) {

    // When this method is run, the start of the event is occurring so all of these 
    // variables should be cleared.
    addRelationClickEvent = false;
	addAttributeClickEvent = false;
    addRelationEventTempView = undefined;
    addRelationEventTempModel = undefined;
    $(".paletteIcon").css('outline-style', 'none');     // Unhighlights the relation icon

    $(domIcon).css('outline-style', 'solid');   
    if(domIcon.id.localeCompare("inheritanceIcon") == 0) {
        addRelationEventTempView = new ImlInheritanceElement();
        addRelationEventTempModel = new ImlInheritance("", "", addRelationEventTempView.id);
		drawTempView = new ImlInheritanceElement();
    } else if(domIcon.id.localeCompare("compositionIcon") == 0) {
        addRelationEventTempView = new ImlCompositionElement();
        addRelationEventTempModel = new ImlComposition("", "", "", 0, 1, addRelationEventTempView.id);
		drawTempView = new ImlCompositionElement();
    } else { // Add reference relation
        addRelationEventTempView = new ImlReferenceElement();
        addRelationEventTempModel = new ImlReference("", "", "", 0, 1, addRelationEventTempView.id);
		drawTempView = new ImlReferenceElement();
    }
	drawTempView.set('router', { name: 'normal' });
    addRelationClickEvent = true;
}

/**
 * Triggers an event to add a attribute by clicks
 * 
 * @param {HtmlElement} domView
 */
function addAttributeToGraphClickEvent(domIcon){
	addRelationClickEvent = false;
	addAttributeClickEvent = false;
    addRelationEventTempView = undefined;
    addRelationEventTempModel = undefined;
    $(".paletteIcon").css('outline-style', 'none');     // Unhighlights the relation icon
	
	 $(domIcon).css('outline-style', 'solid');   
	addAttributeClickEvent = true;
}

function addUserRelationToGraphClickEvent(domIcon) {

    // When this method is run, the start of the event is occurring so all of these 
    // variables should be cleared.
    addRelationClickEvent = false;
	addAttributeClickEvent = false;
    addRelationEventTempView = undefined;
    addRelationEventTempModel = undefined;
    $(".paletteIcon").css('outline-style', 'none');     // Unhighlights the relation icon

	var relName = (domIcon.id).substring(4);
	var relToAdd;
	targetMetaModel.relations.forEach(rel =>{
		if(rel.name && rel.name.localeCompare(relName)==0)
			relToAdd = rel;
	});


    $(domIcon).css('outline-style', 'solid');   
    if((domIcon.id).substring(0,3).localeCompare("ref") == 0) {
        addRelationEventTempView = new ImlReferenceElement();
        addRelationEventTempModel = new ImlReference("", "", relToAdd.name, relToAdd.lowerBound, relToAdd.upperBound, addRelationEventTempView.id);
		drawTempView = new ImlReferenceElement();
    } else if((domIcon.id).substring(0,3).localeCompare("com") == 0) {
        addRelationEventTempView = new ImlCompositionElement();
        addRelationEventTempModel = new ImlComposition("", "", relToAdd.name, relToAdd.lowerBound, relToAdd.upperBound, addRelationEventTempView.id);
		drawTempView = new ImlCompositionElement();
    } 
    addRelationClickEvent = true;

}

function addUserClassModelToGraph(dropPositionX, dropPositionY, imlClassName) {    
    if((typeof imlClassName) == "object")
		imlClassName = imlClassName.id;
	var addClassName = (imlClassName).replace("uc:","");
	targetClasses = targetMetaModel.classes;
	var targetClass = null;
	targetClasses.forEach( candidateClass => {
		if (candidateClass.name.localeCompare(addClassName)==0){
			targetClass = candidateClass;
		}
	});
	
	const classHeight = 25;
	const classWidth = 100;
	var newClassName = targetClass.name;
	
	var imlClassView = new ImlClassElement();
	imlClassView.attr({
		classNameLabel: {
			text: newClassName,
		},
	});
	
	imlClassView.attributes.size.height = classHeight;
	imlClassView.attributes.size.width = classWidth;

	var imlClass = new ImlClass(imlClassView.attributes.attrs.classNameLabel.text, new Map(), new Map(), false, imlClassView.id);
	imlStructuralModel.addClass(imlClass);
	

	// Account for the current translate
	dropPositionX -= paper.options.origin.x;
	dropPositionY -= paper.options.origin.y;

	// Account for the current zoom
	dropPositionX = dropPositionX / paper.scale().sx;
	dropPositionY = dropPositionY / paper.scale().sy;

	imlClassView.position(dropPositionX, dropPositionY);
	graph.addCell(imlClassView);
	
	var elementsUnder = graph.findModelsInArea(imlClassView.getBBox()).filter(el => el !== imlClassView);
	while (elementsUnder.length > 0){
		var oldPos = imlClassView.position();
		oldPos.y += 30;
		imlClassView.position(oldPos.x,oldPos.y);
		elementsUnder = graph.findModelsInArea(imlClassView.getBBox()).filter(el => el !== imlClassView);
	}
	
	var inheritedAttrs = getInheritedAttributes(targetClass, targetMetaModel);
	inheritedAttrs.forEach(attr => {
		var imlAttributeView = new ImlAttributeElement();
		var imlAttribute = new ImlAttribute(
		attr.visibility,
		attr.name,
		attr.type,
		attr.value,
		attr.position,
		imlAttributeView.id,
		attr.lowerBound,
		attr.upperBound
		);
		imlClass.addAttribute(imlAttribute);
        attributeViews.set(imlAttributeView.id, imlAttributeView);  // Keeps track of the view
        attributes.set(imlAttributeView.id, imlAttribute)           // Keeps track of the model
		const attrHeightOffset = 25;
        imlAttributeView.attr({
            attributeRect: {
                ref: 'attributeLabel',
                height: '18.75px',
            },
            attributeLabel: {
                text: imlAttribute.print(),
            }
        });
		
		if (imlAttribute.lowerBound == "0"){ //optional
			if (imlAttribute.upperBound == "1") //optional signle
				imlAttributeView.attr('icon/xlinkHref', 'Resources/optional.png');
			else //optional multiple
				imlAttributeView.attr('icon/xlinkHref', 'Resources/optionalMultiple.png');
		}else{ //mandatory
			if (imlAttribute.upperBound == "1") //optional signle
				imlAttributeView.attr('icon/xlinkHref', 'Resources/required.png');
			else //optional multiple
				imlAttributeView.attr('icon/xlinkHref', 'Resources/requiredMultiple.png');
		}
		
        imlClassView.embed(imlAttributeView);     // Sets new attribute as child of the class
        graph.addCell(imlAttributeView);            // Makes the attribute visible
		
        // Update class model height to account for new element
        const classAttributeRectHeight = parseInt(imlClassView.attributes.attrs.classAttributeRect.height);
        imlClassView.attributes.attrs.classAttributeRect.height = (classAttributeRectHeight + attrHeightOffset);
		centerAndResizeAttributeViewsOnClass(imlClass, imlStructuralModel, paper)
	});
	if(instanceEditor)
		dynamicConformance();
	
	centerAndResizeAttributeViewsOnClass(imlClass, imlStructuralModel, paper);
	undoStack.push(new ImlAction(ImlActionType.ADD, imlClass, ImlActionTargetType.CLASS, null, null));
}
																		   
/**
 * Needed to stop the default drop operation which is to open a link.
 * 
 * @param {Event} ev 
 */
function allowDrop(ev) {
    ev.preventDefault();
}


function redrawSelfRelation(imlClass, rel){
	    var link = graph.getCell(rel.id);
		imlClassView = graph.getCell(imlClass.id);
		
		var classX = imlClassView.position().x;
		var classY = imlClassView.position().y;
		var width = imlClassView.attributes.attrs.classAttributeRect.width;
		var height = imlClassView.attributes.attrs.classAttributeRect.height;
		
		link.vertices([
            new g.Point(classX+(parseFloat(width)/2), classY-40),
            new g.Point(classX-60, classY-40),
            new g.Point(classX-60, classY+(parseFloat(height)/2))
        ]);
}

/**
 * When the destination of a relation is being reassigned, this methods runs after the 
 * relation is dropped to ensure the reassignment is valid.
 * 
 * @param {joint.dia.CellView} cellView 
 */
function checkNewDestination(cellView) {

    var link = graph.getCell(cellView.model.id);
    const imlRelation = imlStructuralModel.relations.get(cellView.model.id);
	var origClass = imlStructuralModel.classes.get(imlRelation.destination);

    var targetClassId = undefined;
    var attributeView = attributeViews.get(cellView.model.attributes.target.id);
    var classModel = imlStructuralModel.classes.get(cellView.model.attributes.target.id);
	
	
    if(attributeView) {
        targetClassId = attributeView.attributes.parent;
    } else if(classModel) {
        targetClassId = classModel.id;
    } else {
        targetClassId = imlStructuralModel.relations.get(cellView.model.id).destination;
    }
	
	imlClassView = graph.getCell(targetClassId);

	let visited = [imlRelation.source];
	if(imlRelation instanceof ImlInheritance && circularInherit(imlStructuralModel,targetClassId, visited)){
		throw new Error("Changing this relation would create a cycle of inheritance; update aborted.");
	}
	visited = [imlRelation.source];
	if(imlRelation instanceof ImlComposition && circularCompose(targetClassId, visited, imlRelation)){
		throw new Error("Changing this relation would create a cycle of composition; update aborted.");
	}
	visited = [imlRelation.source];
	if(imlRelation instanceof ImlBoundedRelation && circularReference(imlStructuralModel, targetClassId, visited,imlRelation)){
		throw new Error("Changing this relation would result in a cycle of required relations; update aborted.");
	}
	if (imlRelation instanceof ImlInheritance){
		srcClass = imlStructuralModel.classes.get(imlRelation.source);
		dstClass = imlStructuralModel.classes.get(targetClassId);
		if(duplicationForward(srcClass, dstClass,imlRelation)){
			throw new Error("Changing this relation would result a duplicate name for attributes and/or relations; update aborted.");
		}		
	}

    // Inheritance relations cannot related to themselves
    if(targetClassId.localeCompare(imlRelation.source) == 0) {
		if(imlRelation instanceof ImlInheritance) {
            targetClassId = imlStructuralModel.relations.get(cellView.model.id).destination;
        }
		else {
			
			var classX = imlClassView.position().x;
			var classY = imlClassView.position().y;
			var width = imlClassView.attributes.attrs.classAttributeRect.width;
			var height = imlClassView.attributes.attrs.classAttributeRect.height;
			
			link.vertices([
				new g.Point(classX+(parseFloat(width)/2), classY-40),
				new g.Point(classX-60, classY-40),
				new g.Point(classX-60, classY+(parseFloat(height)/2))
			]);
			
			imlClassView.embed(link);
		}
    }
	else{
		link.vertices([]);
		var srcClass = graph.getCell(link.attributes.source);
		if (srcClass.attributes.embeds){
			var index = srcClass.attributes.embeds.indexOf(link.id);
			if (index > -1)
				srcClass.attributes.embeds.splice(index,1);
		}
	}

	undoStack.push(new ImlAction(ImlActionType.PAPER_CHANGE, imlRelation, ImlActionTargetType.RELATION, {end: "destination", id: imlStructuralModel.relations.get(cellView.model.id).destination}, {end: "destination", id: targetClassId}));
    imlStructuralModel.relations.get(cellView.model.id).destination = targetClassId;
	origClass.relationIds.delete(imlRelation.id);
	imlStructuralModel.classes.get(targetClassId).relationIds.set(imlRelation.id, imlRelation.id);
	link.target({ id: imlStructuralModel.relations.get(cellView.model.id).destination });
	
}

/**
 * When the source of a relation is being reassigned, this methods runs after the 
 * relation is dropped to ensure the reassignment is valid.
 * 
 * @param {joint.dia.CellView} cellView 
 */
function checkNewSource(cellView) {

    var link = graph.getCell(cellView.model.id);
    const imlRelation = imlStructuralModel.relations.get(cellView.model.id);

	var origClass = imlStructuralModel.classes.get(imlRelation.source);
	
    var sourceClassId = undefined;
    var attributeView = attributeViews.get(cellView.model.attributes.source.id);
    var classModel = imlStructuralModel.classes.get(cellView.model.attributes.source.id);

    if(attributeView) {
        sourceClassId = attributeView.attributes.parent;
    } else if(classModel) {
        sourceClassId = classModel.id;
    } else {
        sourceClassId = imlStructuralModel.relations.get(cellView.model.id).source;
    }

	

	let visited = [sourceClassId];
	if(imlRelation instanceof ImlInheritance && circularInherit(imlStructuralModel,imlRelation.destination, visited)){
		throw new Error("Changing this relation would result in a cycle of inheritance; update aborted.");
	}
	visited = [sourceClassId];
	if(imlRelation instanceof ImlComposition && circularCompose(imlRelation.destination, visited, imlRelation)){
		throw new Error("Changing this relation would result in a cycle of composition; update aborted.");
	}
	visited = [sourceClassId];
	if(imlRelation instanceof ImlBoundedRelation && circularReference(imlStructuralModel, imlRelation.destination, visited, imlRelation)){
		throw new Error("Changing this relation would result in a cycle of required relations; update aborted.");
	}
	if (imlRelation instanceof ImlBoundedRelation && !uniqueAttributeName(imlStructuralModel.classes.get(sourceClassId), imlRelation.name, true, true, imlRelation)){
		throw new Error("Changing this relation would result a duplicate name for attributes and/or relations; update aborted.");
	}
	if (imlRelation instanceof ImlInheritance){
		srcClass = imlStructuralModel.classes.get(sourceClassId);
		dstClass = imlStructuralModel.classes.get(imlRelation.destination);
		if(duplicationForward(srcClass, dstClass)){
			throw new Error("Changing this relation would result a duplicate name for attributes and/or relations; update aborted.");
		}	
	}

	imlClassView = graph.getCell(sourceClassId);
    // Inheritance relations cannot related to themselves
	if(sourceClassId.localeCompare(imlRelation.destination) == 0) {
		if(imlRelation instanceof ImlInheritance) {
            sourceClassId = imlStructuralModel.relations.get(cellView.model.id).source;
        }
		else {
			
			var classX = imlClassView.position().x;
			var classY = imlClassView.position().y;
			var width = imlClassView.attributes.attrs.classAttributeRect.width;
			var height = imlClassView.attributes.attrs.classAttributeRect.height;
			
			link.vertices([
				new g.Point(classX+(parseFloat(width)/2), classY-40),
				new g.Point(classX-60, classY-40),
				new g.Point(classX-60, classY+(parseFloat(height)/2))
			]);
			
			imlClassView.embed(link);
		}
    }
	else{
		link.vertices([]);
		var targetClass = graph.getCell(link.attributes.target);
		if (targetClass.attributes.embeds){
			var index = targetClass.attributes.embeds.indexOf(link.id);
			if (index > -1)
				targetClass.attributes.embeds.splice(index,1);
		}
	}

	undoStack.push(new ImlAction(ImlActionType.PAPER_CHANGE, imlRelation, ImlActionTargetType.RELATION, {end: "source", id: imlStructuralModel.relations.get(cellView.model.id).source}, {end: "source", id: sourceClassId}));
    imlStructuralModel.relations.get(cellView.model.id).source = sourceClassId;
	origClass.relationIds.delete(imlRelation.id);
	imlStructuralModel.classes.get(sourceClassId).relationIds.set(imlRelation.id, imlRelation.id);
	link.source({ id: imlStructuralModel.relations.get(cellView.model.id).source });

}

/**
 * Helper method for the add relation click and drop events. 
 * 
 * @param {joint.dia.CellView} cellView 
 */

function checkTarget(cellView) {
	
    var targetClassId = undefined;
    var attributeView = attributeViews.get(cellView.model.id);
    var classModel = imlStructuralModel.classes.get(cellView.model.id);
	
    // Check if the arrowhead was placed on an attribute of a class
    if(attributeView) {
        targetClassId = attributeView.attributes.parent;
		classModel = imlStructuralModel.classes.get(targetClassId);
    } else if(classModel) {
        targetClassId = classModel.id;
    } else if(cellView.model.id.localeCompare(drawTempView.id)==0){
		//if the accidentally click on the temp relation due to mouse lag, treat as if clicking on blank, and abort
		resetHighlights();
        addRelationClickEvent = false;
		addAttributeClickEvent = false;
        addRelationEventTempView = undefined;
        addRelationEventTempModel = undefined;
        $(".paletteIcon").css('outline-style', 'none');     // Unhighlights the relation icon
		showModelProperties();                         // Clears property table
		if (drawing){
			graph.removeCells(graph.getCell(drawTempView.id));
			drawing = false;
		}
		return false;
	} else {
        throw new Error("Cannot add relation with this target; relations may only be added to classes.");
    }
	
    // Inheritance relations cannot related to themselves
    if(addRelationEventTempModel instanceof ImlInheritance) {
        if(classModel.id == addRelationEventTempView.source().id) {
            throw new Error("Inheritance relations cannot relate to themselves");
        }// nor are multiple inheritance relations from the same class allowed
		else if (duplicateInheritence(addRelationEventTempView.source(), imlStructuralModel.relations)){
			throw new Error("IML does not allow multiple inheritance; a class can only inherit from one other class.");
		}
    }
	
	let visited = [addRelationEventTempView.source().id];
	if(addRelationEventTempModel instanceof ImlInheritance && circularInherit(imlStructuralModel,targetClassId, visited)){
		throw new Error("Adding this relation would create a cycle of inheritance; insertion aborted.");
	}
	else if(addRelationEventTempModel instanceof ImlComposition && circularCompose(targetClassId, visited, addRelationEventTempModel)){
		throw new Error("Adding this relation would create a cycle of composition; insertion aborted.");
	}
	
	if(addRelationEventTempModel instanceof ImlInheritance){
		var srcClass = imlStructuralModel.classes.get(addRelationEventTempView.source().id);
		var dstClass = imlStructuralModel.classes.get(targetClassId);
		
		if (duplicationForward(srcClass,dstClass))
			throw new Error("Adding this relation would result in duplicate attribute or relation names from inherited classes; insertion aborted.");
	}
    // This will not be reached if there is an error.
    addRelationEventTempView.target( { id: targetClassId } );
	return true;

}

function duplicationForward(srcClass, dstClass, candidate=null){
	var duplication = false;
	dstClass.attributes.forEach(attr =>{
		if (!uniqueAttributeName(srcClass, attr.name, true, true, candidate))
			duplication = true;
	});
	
	dstClass.relationIds.forEach(relId =>{
		var rel = imlStructuralModel.relations.get(relId);
		if (!uniqueAttributeName(srcClass, rel.name, true, true, candidate))
			duplication = true;
		
		if (rel instanceof ImlInheritance && rel.source == dstClass.id){
			if (candidate){
				if(rel.id != candidate.id)
					duplication = duplicationForward(srcClass, imlStructuralModel.classes.get(rel.destination));
			}
			else{
				duplication = duplicationForward(srcClass, imlStructuralModel.classes.get(rel.destination));
			}
		}
	});
	return duplication;
}


function deleteCell(deletedCell,fromCutPaste) {
	var deleted = false;
    if(!fromCutPaste)
		var imlClass = imlStructuralModel.classes.get(deletedCell.id);
	else
		var imlClass = clipboardModel.get(deletedCell.id);
    var imlAttribute = attributes.get(deletedCell.id);
    var imlRelation = imlStructuralModel.relations.get(deletedCell.id);


	if(imlClass) {
		var classGraph = graph.getCell(imlClass.id);
		var numRels = 0;
        imlClass.relationIds.forEach( relationId => {
            var relation = graph.getCell(relationId);
			deleteCell(relation,fromCutPaste);
			numRels++;
			//imlStructuralModel.relations.delete(relationId);
			//imlStructuralModel.classes.forEach(curClass =>{
			//	curClass.relationIds.delete(relationId);
			//});
        });
		if(!fromCutPaste)
			undoStack.push(new ImlAction(ImlActionType.DELETE, imlClass, ImlActionTargetType.CLASS, {X: classGraph.attributes.position.x, Y: classGraph.attributes.position.y, H: classGraph.attributes.size.height, W: classGraph.attributes.size.width, numRels: numRels}, null));
        graph.removeCells(classGraph);
        imlStructuralModel.classes.delete(imlClass.id);
		deleted = true;
		
    } else if(imlAttribute) {
		if(!instanceEditor){
			const attributeView = graph.getCell(imlAttribute.id);
			classView = attributeView.getParentCell();
			if(!fromCutPaste){
				const classAttributeRectHeight = parseInt(classView.attributes.attrs.classAttributeRect.height);
				const classAttributeRectWidth  = parseInt(classView.attributes.attrs.classAttributeRect.width);
				classView.attributes.attrs.classAttributeRect.height = (classAttributeRectHeight - 25);
				classView.resize();
			}
			graph.removeCells(graph.getCell(imlAttribute.id));
			imlClass = imlStructuralModel.classes.get(classView.id);
			if(!fromCutPaste)
				undoStack.push(new ImlAction(ImlActionType.DELETE, imlAttribute, ImlActionTargetType.ATTRIBUTE, {classViewModel: classView, imlClass: imlClass}, null));
			
			imlClass.deleteAttribute(imlAttribute);
			attributes.delete(imlAttribute.id);
			
			//var ind = 1;
			//imlClass.attributes.forEach(attr => {
			//	attr.position = ind;
			//	ind++;
			//});
			centerAndResizeAttributeViewsOnClass(imlClass, imlStructuralModel, paper);
			deleted = true;
		}
    } else if(imlRelation) {
		var relationView = graph.getCell(imlRelation.id);
		var data = null;
		if (!(imlRelation instanceof ImlInheritance)){
			data = {
				labels : relationView.attributes.labels,
				vertices : relationView.attributes.vertices
			};
		}
		else{
			data = {
				labels : null,
				vertices : relationView.attributes.vertices
			};
		}
		undoStack.push(new ImlAction(ImlActionType.DELETE, imlRelation, ImlActionTargetType.RELATION, data, null));
		imlStructuralModel.relations.delete(imlRelation.id);
		imlStructuralModel.classes.forEach(curClass =>{
			curClass.relationIds.delete(imlRelation.id);
		});
        graph.removeCells(relationView);
		deleted = true;
    }
	
	if (deleted)
		highlightedElement = removeA(highlightedElement,paper.findViewByModel(deletedCell));
	
	if(instanceEditor)
		dynamicConformance();
	else
		$('#properties').html("");
	
	return deleted;
}

/**
 * Called by a palette icon when dragged.
 * 
 * @param {Event} ev 
 */
function drag(draggedElement, ev) {
    /* This if statement is so gross, just don't look at it. It is justified because the other ways of doing it would involve adding
       a second class tag to these elements so then I would have an array of class. Some elements coming in here would only have one class
       tag so it would just be a whole mess. */
    if( draggedElement.id.localeCompare("inheritanceIcon") == 0 || 
        draggedElement.id.localeCompare("compositionIcon") == 0 || 
        draggedElement.id.localeCompare("referenceIcon") == 0 ) 
    {
        
        $(".paletteIcon").css('outline-style', 'none');     // Unhighlights an relation icon already highlighted
        $(draggedElement).css('outline-style', 'solid');
    } 
    ev.dataTransfer.setData("text", ev.target.id);
} 

/**
 * Called when an element is dropped.
 * 
 * @param {Event} ev 
 */
function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
	if(data.localeCompare("classIcon") == 0) {
        var bodyRect = document.getElementById('paperHolder').getBoundingClientRect();
        var dropPositionX = ev.clientX - bodyRect.left;
        var dropPositionY = ev.clientY - bodyRect.top;
        addClassModelToGraph(dropPositionX, dropPositionY);
    } else if (data.localeCompare("attributeIcon") == 0) {
        addAttributeToClass(ev.toElement);
    } else if (data.localeCompare("inheritanceIcon") == 0) {
        addInheritanceToGraph(ev.toElement);
    } else if (data.localeCompare("compositionIcon") == 0) {
        addCompositionToGraph(ev.toElement);
    } else if (data.localeCompare("referenceIcon") == 0) {
        addReferenceToGraph(ev.toElement);
    } else if (data.substring(0,3).localeCompare("uc:")==0){
		var bodyRect = document.getElementById('paperHolder').getBoundingClientRect();
        var dropPositionX = ev.clientX - bodyRect.left;
        var dropPositionY = ev.clientY - bodyRect.top;
        addUserClassModelToGraph(dropPositionX, dropPositionY, data);
	}
}

function getAttribute(model, id){
	var found = null;
	model.classes.forEach(curClass =>{
		curClass.attributes.forEach(attr =>{
			if (attr.id == id){
				found = attr;
			}
		});
	});
	return found;
}

function createSelection(field, start, end) {
    if( field.createTextRange ) {
      var selRange = field.createTextRange();
      selRange.collapse(true);
      selRange.moveStart('character', start);
      selRange.moveEnd('character', end);
      selRange.select();
      field.focus();
    } else if( field.setSelectionRange ) {
      field.focus();
      field.setSelectionRange(start, end);
    } else if( typeof field.selectionStart != 'undefined' ) {
      field.selectionStart = start;
      field.selectionEnd = end;
      field.focus();
    }
}
// Temporary var for saving the table cell value if a new one is not entered.
// When a concrete data structure is defined, this may be able to be removed.
var tableCellValueHolder = "";
var prevValue = "";

/**
 * Prepares the click on table cell for edit. Adds a textbox to the clicked on cell for receiving input.
 * When a cell is changed to 'edit mode', it is given the custom tag 'editElementId'. This is the id of the corresponding 
 * element. This is necessary to ensure the property that is being changed correspondes to the correct element. editElementId is
 * used in saveEdit to ensure this.
 * 
 * @param {<td>} tableCell 
 */
var extendedVal = false;
var unbounded = false;
function edit(tableCell) {
	if (highlightedElement.length == 1)
		var editElementId = highlightedElement[0].model.id;
	else
		var editElementId = 'imlStructuralModel';

    if(tableCellValueHolder == "") {
        cellValue = $(tableCell).text();
		if (cellValue.localeCompare("")==0)
			tableCellValueHolder = IMLEmptyValue;
		else
			tableCellValueHolder = cellValue;
		
        if($(tableCell).attr('id').localeCompare("typeProperty") == 0) {

            var imlTypes = [ ImlType.BOOLEAN, ImlType.DOUBLE, ImlType.INTEGER, ImlType.STRING ];

            var propertiesCellString = '<select id="cellInput" class="editing" onblur="saveEdit(this)" onchange="saveEdit(this)" editElementId="'+ editElementId + '">';

            propertiesCellString += '<option value=' + cellValue + '>' + cellValue + '</option>';

            imlTypes.forEach(function(imlType){
                if(cellValue.localeCompare(imlType) != 0) {
                    propertiesCellString += '<option value=' + imlType + '>' + imlType + '</option>';
                }
            });

            propertiesCellString += '</select>';

            $(tableCell).html(propertiesCellString);
			$('#cellInput').focus();

        } else if($(tableCell).attr('id').localeCompare("visibilityProperty") == 0) {

            var imlVisibilities = [ ImlVisibilityType.PUBLIC, ImlVisibilityType.PRIVATE, ImlVisibilityType.PROTECTED ];
            var propertiesCellString = '<select id="cellInput" class="editing" onblur="saveEdit(this)" onchange="saveEdit(this)" editElementId="'+ editElementId + '">';
            
            propertiesCellString += '<option value=' + cellValue + '>' + cellValue + '</option>';

            imlVisibilities.forEach(function(visibilityType) {
                if(cellValue.localeCompare(visibilityType) != 0) {
                    propertiesCellString += '<option value=' + visibilityType + '>' + visibilityType + '</option>';
                }
            });

            propertiesCellString += '</select>';

            $(tableCell).html(propertiesCellString);
			$('#cellInput').focus();
                            
        } else if($(tableCell).attr('id').localeCompare("booleanProperty") == 0) {

            if(cellValue.localeCompare("TRUE") == 0) {
                $(tableCell).html(  
                                    '<select id="cellInput" class="editing" onblur="saveEdit(this)" onchange="saveEdit(this)" editElementId="'+ editElementId + '">' +
										'<option value="TRUE">TRUE</option>' +
                                        '<option value="FALSE">FALSE</option>' +
                                    '</select>'
                                );
            } else {
                $(tableCell).html(  
                    '<select id="cellInput" class="editing" onblur="saveEdit(this)" onchange="saveEdit(this)" editElementId="'+ editElementId + '">' +
                        '<option value="FALSE">FALSE</option>' +
                        '<option value="TRUE">TRUE</option>' +
                    '</select>'
                );
            }
			$('#cellInput').focus();
		} else if($(tableCell).attr('id').localeCompare("valueProperty") == 0) {
				
				var curAttr = getAttribute(imlStructuralModel, editElementId);
				
				
				
				if(Array.isArray(curAttr.value)){
				valString = "[";
					for (var index = 0; index < curAttr.value.length; index++) { 
						if(curAttr.type == ImlType.STRING){valString +='"';}
						valString += curAttr.value[index];
						if(curAttr.type == ImlType.STRING){valString +='"';}
						if(index != curAttr.value.length -1){valString += ", ";}
					} 
					valString += "]";
				}
				else{
					if (curAttr.value)
						valString = curAttr.value;
					else
						valString = "";
				}
				
                var propertiesCellString = '<input select id="cellInput" class="editing" type="text" onblur="saveEdit(this)" editElementId="'+ editElementId + '" value="';
				propertiesCellString += valString.split('"').join('&quot;');	
				propertiesCellString += '" />';
				propertiesCellString += '<button class="valueButton" onmouseenter="extendedVal=true" onmouseleave="extendedVal=false">...</button>';
				$(tableCell).html(propertiesCellString);
                $('#cellInput').select();
					   
        } else if($(tableCell).attr('id').localeCompare("textProperty") == 0) {

                $(tableCell).html('<input select id="cellInput" class="editing" type="text" onblur="saveEdit(this)" editElementId="'+ editElementId + '" value="' + cellValue + '" />');
				$('#cellInput').select();

        } else if($(tableCell).attr('id').localeCompare("fileProperty") == 0) {

                $(tableCell).html('<input select id="cellInput" class="editing" type="text" onblur="saveEdit(this)" editElementId="'+ editElementId + '" value="' + cellValue + '" />');
                
				
				$('#cellInput').focus();
				var message = document.getElementById('cellInput');
				createSelection(message,0,message.value.length-4);

        }else if($(tableCell).attr('id').localeCompare("conformsProperty") == 0) {
			if(cellValue.localeCompare("IML Definition") == 0) {
                $(tableCell).html(  
                                    '<select id="cellInput" class="editing" onblur="saveEdit(this)" onchange="saveEdit(this)" editElementId="'+ editElementId + '">' +
										'<option value="IML Definition">IML Definition</option>' +
                                        '<option value="UDM">User Defined Meta-Model</option>' +
                                    '</select>'
                                );
            } else {
                $(tableCell).html(  
                    '<select id="cellInput" class="editing" onblur="saveEdit(this)" onchange="saveEdit(this)" editElementId="'+ editElementId + '">' +
                        '<option value="UDM">User Defined Meta-Model</option>' +
						'<option value="IML Definition">IML Definition</option>' +
                    '</select>'
                );
            }



                
                $('#cellInput').focus();

        } else if($(tableCell).attr('id').localeCompare("classProperty") == 0) {
            relationModel = imlStructuralModel.relations.get(editElementId);
            
            // Will need to prevent inheritance relations from relating to themselves.

            var propertiesCellString = '<select id="cellInput" class="editing" onblur="saveEdit(this)" onchange="saveEdit(this)" editElementId="'+ editElementId +'">';

            propertiesCellString += '<option value=' + cellValue + '>' + cellValue + '</option>';
			
            
            imlStructuralModel.classes.forEach(function(value, key) {
                if(value.name.localeCompare(cellValue) != 0) {
                    propertiesCellString += '<option id=' + key + ' value=' + value.name + '>' + value.name + '</option>';
                }
            });

            propertiesCellString += '</select>';
            $(tableCell).html(propertiesCellString);
			$('#cellInput').focus();
        } else if($(tableCell).attr('id').localeCompare("numberProperty") == 0) {
            var propertyNameCell = $(tableCell).siblings()[0];
            var propertyName = $(propertyNameCell).html();

            if(propertyName.localeCompare("Upper Bound") == 0) {
                $(tableCell).html(  
                    '<input id="cellInput" class="numberInputNumber" type="number" onblur="saveEdit(this)" editElementId="'+ editElementId + '" min="0" value=' + cellValue + ' />' +
                    // onmouseenter/leave toggles the unbounded variable. This combined with the onblur event for the number input effectively
                    // detects the unbounded button click.
                    '<button class="numberInputButton" onmouseenter="unbounded=true" onmouseleave="unbounded=false">*</button>'                
                                );
            } else {
                $(tableCell).html(  '<input id="cellInput" class="editable" type="number" min="0" onblur="saveEdit(this)" editElementId="'+ editElementId + '" value=' + cellValue + ' />');
            }
			$('#cellInput').select();

        }
    }
	
}

function exportCurrentModel(element) {
	//check if save or export
	if(element.id == 'save') {
		//add extra parameter to end
		exportStructuralModel(element, imlStructuralModel, graph, routingMode, instanceEditor, true);
	} else {
		exportStructuralModel(element, imlStructuralModel, graph, routingMode, instanceEditor);
	}
}

function getContainingClass(imlAttribute){
	var id = imlAttribute.id;
	var containingClass = null;
	imlStructuralModel.classes.forEach(imlClass => {
		
		imlClass.attributes.forEach(attr =>{
			if (id == attr.id){
				containingClass = imlClass;
			}
		});
	});
	return containingClass;
}

function toArray(input){
	input = input.replace("[","");
	input = input.replace("]","");
	return input.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
}
	
function redrawRelations() {
    graph.getLinks().forEach(link => {
        const source = link.source();
        link.source({ x: 0, y: 0});
        link.source(source);
        const target = link.target();
        link.target({ x: 0, y: 0});
        link.target(target);
    });
}

function convertValue(imlAttribute, tableCellValueHolder, newValue){

	var tempResult = [];

	var oldValue = [];
		
	if(Array.isArray(imlAttribute.value))
		oldValue = imlAttribute.value;
	else
		oldValue.push(imlAttribute.value);

	for (var i = 0; i < oldValue.length; i++){
		var curVal = oldValue[i];
		
		if (newValue == ImlType.INTEGER){
			if (tableCellValueHolder == ImlType.BOOLEAN){
				if (curVal == "TRUE" || curVal == "1")
					tempResult.push("1");
				else if (curVal == "FALSE" || curVal == "0")
					tempResult.push("0");
				else
					tempResult.push("");
			}
			else{
				var temp = parseInt(curVal);
				if (curVal == "")
					tempResult.push("");
				else if (isNaN(temp))
					tempResult.push("0");
				else
					tempResult.push(temp.toString());
			}
		}
		else if (newValue == ImlType.DOUBLE){
			if (tableCellValueHolder == ImlType.BOOLEAN){
				if (curVal == "TRUE" || curVal == "1.0")
					tempResult.push("1.0");
				else if (curVal == "FALSE" || curVal == "0.0")
					tempResult.push("0.0");
				else
					tempResult.push("");
			}
			else{
				var temp = parseFloat(curVal);
				if (curVal == "")
					tempResult.push("");
				else if (isNaN(temp))
					tempResult.push("0.0");
				else
					tempResult.push(temp.toString());
			}
		}
		else if (newValue == ImlType.BOOLEAN){
			if (curVal == FALSE_VAL)
					tempResult.push("FALSE");
			else if (curVal == TRUE_VAL)
					tempResult.push("TRUE");
			else if (tableCellValueHolder == ImlType.STRING){
				if (!curVal || curVal == "")
					tempResult.push(FALSE_VAL);
				else
					tempResult.push(TRUE_VAL);
			}
			else {
				var tempNum = parseFloat(curVal.toLowerCase());
				if (isNaN(tempNum) || ((!isNaN(tempNum) && tempNum == 0)))
					tempResult.push(FALSE_VAL);
				else
					tempResult.push(TRUE_VAL);
			}
		}
		else {
			tempResult.push(curVal);
		}
	
		

	}
	if (tempResult.length == 1)
		tempResult = tempResult[0];
	else if (tempResult.length == 0)
		tempResult = "";
	
	return tempResult;
	
}

/**
 * Called after the user is finished editing an attribute. Updates the paper and backend to reflect the changes to the attribute.
 * NOTE: There is a race condition when selecting the highlighted cell after making an edit. The backend updates and everything runs fine but,
 * the edit may or may not be reflected in the view.
 * 
 * @param {<input>} inputElement 
 */
function saveEdit(inputElement) {

	if (tableCellValueHolder != "")
		prevValue = tableCellValueHolder;
	
    // Retreives the id of the correspnding element to be changed.
	var target, targetType, previousValue, newActionValue;
	try{
		var editElementId = $(inputElement).attr('editElementId');
		var newValue;
		
		if (extendedVal){
			var input = prompt("Enter values for your attribute, separated by a comma (,)",toArray(inputElement.value));
			newValue = input.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
			extendedVal = false;
		}
		else if(unbounded) { // Checks for unbounded button press for number inputs
			newValue = "*";
			unbounded = false;
		} else {
			newValue = $(inputElement).val();
		}
		
		const imlClass = imlStructuralModel.classes.get(editElementId);
		const imlAttribute = attributes.get(editElementId);
		const imlRelation = imlStructuralModel.relations.get(editElementId);
		var propertyValue = $(inputElement).parent();
		var propertyNameCell = propertyValue.siblings()[0];
		var propertyName = $(propertyNameCell).html().replace(" ", "");
		var classNameWidth;
		var undoSelf = false;
		var secondPrev = [];
		var secondNext = [];
		
		if (imlClass){ //if the class name changes, ensure the new name is unique
			targetType = ImlActionTargetType.CLASS;
			target = imlClass;
			if (propertyName.localeCompare("Name")==0){
				if((newValue != tableCellValueHolder) && duplicateName(newValue,imlStructuralModel.classes))
					throw new Error('IML Structural Model already contains a Class with the name "' + newValue + '". Please use unqiue Class names.');
				if (!validIdentifier(newValue))
					throw new Error('"' + newValue + '" is not a valid Class name; valid identifiers contain only: letters, digits, underscores, or dollar signs, and must not begin with a digit. Keywords must also not be used.');
			}
		}
		else if (imlAttribute){ //if it is an attribute that has changed
			targetType = ImlActionTargetType.ATTRIBUTE;
			target = imlAttribute;
			//specifically the attribute value

			if (propertyName.localeCompare("Value")==0) { //new value, we need type
				//if the new value is not blank, and is not a valid assignment to the attribute type
				
				
				if((!Array.isArray(newValue)) && newValue.charAt(0) == '['){
						newValue = toArray(newValue);
						//type check array
				}
				if((!Array.isArray(newValue)) && imlAttribute.upperBound > 1){
					if (newValue)
						newValue = [newValue];
				}
			
				if((Array.isArray(newValue))){
					//type check arrays
					if (newValue.length > imlAttribute.upperBound){
						throw new Error('The entered array [' + newValue + '] of size ' + newValue.length +  ' has more attributes than the allowable upper bound of ' + imlAttribute.upperBound);
					}
					else if (newValue.length < imlAttribute.lowerBound){
						throw new Error('The entered array [' + newValue + '] of size ' + newValue.length +  ' has fewer attributes than the allowable lower bound of ' + imlAttribute.lowerBound);
					}
					for (var index = 0; index < newValue.length; index++) { 
						if (imlAttribute.type == ImlType.BOOLEAN){
							newValue[index] = newValue[index].toUpperCase();
							if(newValue[index].localeCompare("T")==0)
								newValue[index] = "TRUE";
							else if (newValue[index].localeCompare("F")==0)
								newValue[index] = "FALSE";
						}
						newValue[index] = newValue[index].split('"').join('');
						if (!(validAssignment(newValue[index],imlAttribute.type))){
							throw new Error('The entered value "' + newValue[index] + '" is not a valid input for type ' + imlAttribute.type);
						}
					}
				}	
				else{
					if (imlAttribute.type == ImlType.BOOLEAN){
						newValue = newValue.toUpperCase();
						if(newValue.localeCompare("T")==0)
							newValue = "TRUE";
						else if (newValue.localeCompare("F")==0)
							newValue = "FALSE";
					}

					if (!(newValue.localeCompare("")==0)&&(!(validAssignment(newValue,imlAttribute.type))))
						//throw an error and abort the update
						throw new Error('The entered value "' + newValue + '" is not a valid input for type ' + imlAttribute.type);
					else if (!(newValue.localeCompare("")==0) && imlAttribute.lowerBound > 1)
						throw new Error('The entered value "' + newValue + '" is not an array with the required minimum number of elements (lower bound) of ' + imlAttribute.lowerBound);
				}
				
			}
			//if the attribute type has changed, clear the value since it will not be valid
			else if (propertyName.localeCompare("Type")==0) {
				if (!(tableCellValueHolder == newValue)){
					
					var newResult = convertValue(imlAttribute, tableCellValueHolder, newValue);
					
					secondPrev.push({property: "Value", value: imlAttribute.value});
					secondNext.push({property: "Value", value: newResult});
					imlAttribute.value = newResult;
					/*
					if (imlAttribute.lowerBound > 0 & imlAttribute.value != ""){
						var newArray = [];
						for (var i = 0; i < imlAttribute.lowerBound; i++){
								if (newValue == ImlType.STRING)newArray[i] = "";
								else if (newValue == ImlType.INTEGER)newArray[i] = 0;
								else if (newValue == ImlType.DOUBLE)newArray[i] = 0;
								else if (newValue == ImlType.BOOLEAN)newArray[i] = "FALSE";
						}
						secondPrev.push({property: "Value", value: imlAttribute.value});
						secondNext.push({property: "Value", value: newArray});
						imlAttribute.value = newArray;	
						
					}
					else{
						secondPrev.push({property: "Value", value: imlAttribute.value});
						secondNext.push({property: "Value", value: ""});
						imlAttribute.value = "";
					}*/
				}
			}
			//ensure a new upper bound is valid and above the lower bound
			else if (propertyName.localeCompare("UpperBound")==0){
				if (!(validUpperBound(newValue))){
					throw new Error('The value ' + newValue + ' is not a valid upper bound. Bounds must be positive integers, or * to indicated unbounded');
				}				
				var lowerBound = imlAttribute.lowerBound;
				if (!(validBounds(lowerBound,newValue))){
					throw new Error('The newly entered upper bound (' + newValue + ') creates a violation of valid bounds(typically caused by the lower bound being greater than the upper bound). Please enter a valid upper bound.');
				}
				
			
				if (newValue == 1){
					if(imlAttribute.value[0]){
						secondPrev.push({property: "Value", value: imlAttribute.value});
						secondNext.push({property: "Value", value: imlAttribute.value[0]});
						imlAttribute.value = imlAttribute.value[0];
					}
					else{
						secondPrev.push({property: "Value", value: imlAttribute.value});
						secondNext.push({property: "Value", value: ""});
						imlAttribute.value = "";
					}
				}
				else if (parseInt(newValue) < parseInt(tableCellValueHolder) || tableCellValueHolder.localeCompare("*")==0 && newValue.localeCompare("*")!=0){
					if(Array.isArray(imlAttribute.value) && parseInt(newValue) < imlAttribute.value.length){
						var newArray = [];
						for (var i = 0; i < newValue; i++){
							newArray[i] = imlAttribute.value[i];
						}
						secondPrev.push({property: "Value", value: imlAttribute.value});
						secondNext.push({property: "Value", value: newArray});
						imlAttribute.value = newArray;
					}
				}
				else if (parseInt(tableCellValueHolder) == 1 && (parseInt(newValue) > 1 || newValue.localeCompare("*")==0)){
					if (imlAttribute.value){
						secondPrev.push({property: "Value", value: imlAttribute.value});
						secondNext.push({property: "Value", value: [imlAttribute.value]});
						imlAttribute.value = [imlAttribute.value];
					}
				}
				
			} 
			//ensure a new lower bound is valid and below the upper bound
			else if (propertyName.localeCompare("LowerBound")==0){
				if (!(validLowerBound(newValue))){
					throw new Error('The value ' + newValue + ' is not a valid lower bound. Bounds must be positive integers.');
				}
				
				if ((imlAttribute.upperBound != "*") && newValue > imlAttribute.upperBound){
					secondPrev.push({property: "UpperBound", value: imlAttribute.upperBound});
					secondNext.push({property: "UpperBound", value: newValue});
					imlAttribute.upperBound = newValue;
				}
				var upperBound = imlAttribute.upperBound;
				if (!(validBounds(newValue,upperBound))){
					throw new Error('The newly entered lower bound (' + newValue + ') creates a violation of valid bounds (typically caused by the lower bound being greater than the upper bound). Please enter a valid lower bound.');
				}
				
				if (parseInt(newValue) > parseInt(tableCellValueHolder)){
					if(Array.isArray(imlAttribute.value)){
						var top = Math.max(newValue, imlAttribute.value.length);
						var newArray = [];
						for (var i = 0; i < top; i++){
							if (i < imlAttribute.value.length)
								newArray[i] = imlAttribute.value[i];
							else{
								if (imlAttribute.type == ImlType.STRING)newArray[i] = "";
								else if (imlAttribute.type == ImlType.INTEGER)newArray[i] = 0;
								else if (imlAttribute.type == ImlType.DOUBLE)newArray[i] = 0;
								else if (imlAttribute.type == ImlType.BOOLEAN)newArray[i] = "FALSE";
							}
						}
						secondPrev.push({property: "Value", value: imlAttribute.value});
						secondNext.push({property: "Value", value: newArray});
						imlAttribute.value = newArray;
					}
					else if (parseInt(newValue) == 1){
						secondPrev.push({property: "Value", value: imlAttribute.value});
						secondNext.push({property: "Value", value: [imlAttribute.value]});
						imlAttribute.value = imlAttribute.value;
					}
					else {
						var newArray = [];
						if(imlAttribute.value.localeCompare("")!=0){
							newArray[0] = imlAttribute.value;
								
							for (var i = 1; i < newValue; i++){
									if (imlAttribute.type == ImlType.STRING)newArray[i] = "";
									else if (imlAttribute.type == ImlType.INTEGER)newArray[i] = 0;
									else if (imlAttribute.type == ImlType.DOUBLE)newArray[i] = 0;
									else if (imlAttribute.type == ImlType.BOOLEAN)newArray[i] = "FALSE";
							}
							secondPrev.push({property: "Value", value: imlAttribute.value});
							secondNext.push({property: "Value", value: newArray});
							imlAttribute.value = newArray;
						}
					}
				}
			}	//if the name has changed, check to make sure new name is unique										 
			else if (propertyName.localeCompare("Name")==0){
				var containingClass = getContainingClass(imlAttribute);
				
				//if((newValue != tableCellValueHolder) && duplicateName(newValue,containingClass.attributes) && (tableCellValueHolder != newValue))
				if((newValue != tableCellValueHolder) && !uniqueAttributeName(containingClass, newValue) && (tableCellValueHolder != newValue))
					throw new Error('IML Class ' + containingClass.name + ' already contains, inherits, or is inherited by a Class with an attribute/relation with the name "' + newValue + '". Please use unqiue attribute names.');
				if (!validIdentifier(newValue))
					throw new Error('"' + newValue + '" is not a valid Attribute name; valid identifiers contain only: letters, digits, underscores, or dollar signs, and must not begin with a digit. Keywords must also not be used.');
			}
		}
		else if (imlRelation){//if the change occurred to a relation
			targetType = ImlActionTargetType.RELATION;
			target = imlRelation;
			//check to make sure the new name is unique
			if(propertyName.localeCompare("Name")==0){
				var srcClass = imlStructuralModel.classes.get(imlRelation.source);
				var srcClassListA = srcClass.attributes;
				if((newValue != tableCellValueHolder)) {
					if (!uniqueAttributeName(srcClass, newValue)){
						throw new Error('IML Class ' + srcClass.name + ' already contains, inherits, or is inherited by a Class with an attribute/relation with the name "' + newValue + '". Please select a unique relation name.');
					}
					else if (duplicateRelation(newValue,srcClass,imlStructuralModel.relations)){
						throw new Error('IML Class ' + srcClass.name + ' already contains a relationship with the name "' + newValue + '". Please select a unique relation name.');
					}
				}
				if (!validIdentifier(newValue))
					throw new Error('"' + newValue + '" is not a valid Relation name; valid identifiers contain only: letters, digits, underscores, or dollar signs, and must not begin with a digit. Keywords must also not be used.');
			}
			//ensure a new upper bound is valid and above the lower bound 
			else if (propertyName.localeCompare("UpperBound")==0){
				if (!(validUpperBound(newValue))){
					throw new Error('The value ' + newValue + ' is not a valid upper bound. Bounds must be positive integers, or * to indicated unbounded');
				}
				var lowerBound = imlRelation.lowerBound;
				if (!(validBounds(lowerBound,newValue))){
					throw new Error('The newly entered upper bound (' + newValue + ') creates a violation of valid bounds(typically caused by the lower bound being greater than the upper bound). Please enter a valid upper bound.');
				}
				
			} 
			//ensure a new lower bound is valid and below the upper bound
			else if (propertyName.localeCompare("LowerBound")==0){
				if (!(validLowerBound(newValue))){
					throw new Error('The value ' + newValue + ' is not a valid lower bound. Bounds must be positive integers.');
				}
				if ((imlRelation.upperBound != "*") && newValue > imlRelation.upperBound){
					secondPrev.push({property: "UpperBound", value: imlRelation.upperBound});
					secondNext.push({property: "UpperBound", value: newValue});
					imlRelation.upperBound = newValue;
				}
				var upperBound = imlRelation.upperBound;
				if (!(validBounds(newValue,upperBound))){
					throw new Error('The newly entered lower bound (' + newValue + ') creates a violation of valid bounds (typically caused by the lower bound being greater than the upper bound). Please enter a valid lower bound.');
				}
				
				if (newValue > 0){	
					
					if(imlRelation instanceof ImlBoundedRelation && (imlRelation.source.localeCompare(imlRelation.destination)==0)){
						throw new Error("Making this a required relation would result in a cycle of required relations; update aborted.");
					}
					
					let visited = [imlRelation.source];
					if(imlRelation instanceof ImlBoundedRelation && circularReference(imlStructuralModel, imlRelation.destination, visited, imlRelation)){
						throw new Error("Making this a required relation would result in a cycle of required relations; update aborted.");
					}
					else if (imlRelation instanceof ImlComposition && imlRelation.source == imlRelation.destination){
						throw new Error("Self composition relations cannot be required (the lower bound must not be greater than 0); update aborted.");
					}
				}
			}
			//if source or destination changes
			else if ((propertyName.localeCompare("Source")==0) || (propertyName.localeCompare("Destination")==0)){
				if (imlRelation.source == imlRelation.destination){
					undoSelf = true;
				}
				//and the relation is inheritance, ensure that the new relation is not self-inheritance
				if (imlRelation instanceof ImlInheritance){
					if(propertyName.localeCompare("Source")==0){
						var opposite = imlStructuralModel.classes.get(imlRelation.destination);
						if (opposite.name == newValue){
							throw new Error ('An inheritance relation cannot have the same source and target.');
						}
						var srcClass = null;
						imlStructuralModel.classes.forEach(imlClass =>{
							if (imlClass.name == newValue)
								srcClass = imlClass;
						});
						var dstClass = opposite;
						if (duplicationForward(srcClass,dstClass))
							throw new Error("Changing this relation would result a duplicate name for attributes and/or relations; update aborted.");							
					}
					else{
						var opposite = imlStructuralModel.classes.get(imlRelation.source);
						if (opposite.name == newValue){
							throw new Error ('An inheritance relation cannot have the same source and target.');
						}
						var dstClass = null;
						imlStructuralModel.classes.forEach(imlClass =>{
							if (imlClass.name == newValue)
								dstClass = imlClass;
						});
						var srcClass = opposite;
						if (duplicationForward(srcClass,dstClass))
							throw new Error("Changing this relation would result a duplicate name for attributes and/or relations; update aborted.");
					}
				}
				else{
					if(((propertyName.localeCompare("Source")==0)      && (imlStructuralModel.classes.get(imlRelation.destination).name.localeCompare(newValue)==0)) || 
					   ((propertyName.localeCompare("Destination")==0) && (imlStructuralModel.classes.get(imlRelation.source).name.localeCompare(newValue)==0))){
						if (imlRelation.lowerBound > 0){
							throw new Error("This change would result in a required self reference; update aborted.");
						}
					}
					var visited;
					var dest;
					if (propertyName.localeCompare("Source")==0) {
						visited = [getClassIDByName(newValue)];
						dest = imlRelation.destination;
					}
					else{
						visited = [imlRelation.source];
						dest = getClassIDByName(newValue);
					}
					if(imlRelation instanceof ImlBoundedRelation && circularReference(imlStructuralModel, dest, visited, imlRelation)){
						throw new Error("Changing this relation would result in a cycle of required relations; update aborted.");
					}
					if (!uniqueAttributeName(imlStructuralModel.classes.get(getClassIDByName(newValue)), imlRelation.name, true, true, imlRelation)){
						throw new Error("Changing this relation would result a duplicate name for attributes and/or relations; update aborted.");
					}
				}
			}
		}
		else{ //model level properties have changed
			targetType = ImlActionTargetType.MODEL;
			target = imlStructuralModel;
			if (propertyName.localeCompare("ModelName")==0){
				if (validModelName(newValue)){
					imlStructuralModel.setName(newValue);
					var newFileName = newValue.replace(/[^\w\s]/gi, '').replace(' ','_') + ".iml";
					secondPrev.push({property: "FileName", value: imlStructuralModel.fileName});
					secondNext.push({property: "FileName", value: newFileName});
					imlStructuralModel.setFileName(newFileName);
				}
				else {
					throw new Error('"' + newValue + '" is not a valid Model name; valid Model names contain only: letters, digits, underscores, and must not begin with a digit. Keywords must also not be used.');
				}
			} 
			else if (propertyName.localeCompare("FileName")==0){
				var validName = validFileName(newValue);
				if (validName)
					imlStructuralModel.setFileName(validName);
				else
					throw new Error (newValue + " is not a valid IML file name.");
			}
			else if (propertyName.localeCompare("ConformsTo")==0){
				counter++;
				if (counter % 2 == 0 && newValue != tableCellValueHolder){
					swal({
					  title: "Proceed with New Meta-Model Selection",
					  text: "By changing the conformsTo property, elements of your model may no longer be valid and may be automatically removed. Are you sure you wish to proceed?",
					  icon: "warning",
					  buttons: [
						'No',
						'Yes'
					  ],
					  dangerMode: true,
					}).then(function(isConfirm) {
					  if (isConfirm) {
						if (newValue.localeCompare("IML Definition")==0){
							newValue = "IML Definition";
							imlStructuralModel.setConformsTo(newValue);
							instanceEditor = false;
							$("#create").removeClass("disabled").find("a").attr("onclick", "createInstance()");
							$("#check").addClass("disabled").find("a").attr("onclick", "return false;");
							$("#conformanceBlock").hide();
							$("#conformIcon").hide();
							$("#conformanceErrors").hide();
							showModelProperties();
							addPaletteIcons();
						}
						else{
							var elem = document.getElementById('readMeta');
							if(elem && document.createEvent) {
								var evt = document.createEvent("MouseEvents");
								evt.initEvent("click", true, false);
								elem.dispatchEvent(evt);
							}
							instanceEditor = true;
							$("#check").removeClass("disabled").find("a").attr("onclick", "reportConformance()");
							$("#create").addClass("disabled").find("a").attr("onclick", "return false;");
							$("#conformanceBlock").show();
							$("#conformIcon").show();
							$("#conformIcon").css('background-color', '#5cb85c');
						}
					  } 
					})
				}
			}
		}
		propertyValue.empty(); 
		propertyValue.text(newValue);
	   

		if(!Array.isArray(newValue) && newValue.localeCompare("") == 0) { // If incoming value is empty, then don't change the property value.
			if(propertyName.localeCompare("Value") != 0) { // Unless the property is Value from the attribute properties.
				newValue = tableCellValueHolder;
			}
		}

		// Attempts to retreive the model that corresponds to the inputElement
		if(imlClass) {
			imlClass.updatePropertyByString(propertyName, newValue);
			const attrPadding = 10;

			var imlClassView = paper.findViewByModel(imlClass);

			// Save previous width
			var previousClassWidth = imlClassView.selectors.classAttributeRect.width.baseVal.value;

			
			// Apply class name in model to view, in case of change, then resize
			if(imlClass.isAbstract === 'true'){
				imlClassView.model.attributes.attrs.classNameLabel.text = '<< ' + imlClass.name + ' >>';
				imlClassView.model.attributes.attrs.classAttributeRect.fill = 'rgba(224,224,224,0.6)';
				imlClassView.model.attributes.attrs.classNameLabel.fontStyle =	'italic';
			}
			else{ 
				imlClassView.model.attributes.attrs.classNameLabel.text = imlClass.name;
				imlClassView.model.attributes.attrs.classAttributeRect.fill = 'rgba(204,229,255,1.0)';
				imlClassView.model.attributes.attrs.classNameLabel.fontStyle =	'normal';
			}
			
			classNameWidth = imlClassView.selectors.classNameLabel.textLength.baseVal.value + 15;

			imlClassView.model.attributes.attrs.classAttributeRect.width = classNameWidth;
			imlClassView.resize(); // This is being used as a redraw.
			
			var newClassWidth = imlClassView.selectors.classAttributeRect.width.baseVal.value;

			if(newClassWidth <= previousClassWidth) {
				var maxAttributeWidth = 0;
				// Find the largest attribute width
				imlClass.attributes.forEach(attribute => {
					// Get the SVG element from the paper
					const attributePaperView = paper.findViewByModel(attributeViews.get(attribute.id));
					// Get the length of the attribute text element
					var attributeNameWidth = attributePaperView.selectors.attributeLabel.firstChild.textLength.baseVal.value + attrPadding;
					// Keep track of the largest length
					if(attributeNameWidth > maxAttributeWidth) { maxAttributeWidth = attributeNameWidth; }
				});
				// Add the padding between the edge of the attribute and the edge of the class.
				maxAttributeWidth = maxAttributeWidth + attrPadding;

				// If newClassWidth is smaller, then resize to the largest attribute width
				if(newClassWidth <= maxAttributeWidth) {
					imlClassView.model.attributes.attrs.classAttributeRect.width = maxAttributeWidth;
					imlClassView.resize();
				}
			}
						
			
			centerAndResizeAttributeViewsOnClass(imlClass, imlStructuralModel, paper);

		} else if(imlAttribute) {
			const attrPadding = 10;
			const attrMargin = 10;
			const classNamePadding = 15;
			
			imlAttribute.updatePropertyByString(propertyName, newValue);
			var imlAttributeView = paper.findViewByModel(imlAttribute);
			imlAttributeView.model.attr('attributeLabel/text', imlAttribute.print());
			
			if (imlAttribute.lowerBound == "0"){ //optional
				if (imlAttribute.upperBound == "1") //optional signle
					imlAttributeView.model.attr('icon/xlinkHref', 'Resources/optional.png');
				else //optional multiple
					imlAttributeView.model.attr('icon/xlinkHref', 'Resources/optionalMultiple.png');
			}else{ //mandatory
				if (imlAttribute.upperBound == "1") //optional signle
					imlAttributeView.model.attr('icon/xlinkHref', 'Resources/required.png');
				else //optional multiple
					imlAttributeView.model.attr('icon/xlinkHref', 'Resources/requiredMultiple.png');
			}											 
			imlAttributeView.resize();

			var classElementView = paper.findViewByModel(attributeViews.get(imlAttribute.id).getParentCell());
			var imlClassModel = imlStructuralModel.classes.get(classElementView.model.id);
			classNameWidth = classElementView.selectors.classNameLabel.textLength.baseVal.value + classNamePadding;

			var maxAttributeWidth = 0;
			imlClassModel.attributes.forEach(attribute => {
				// Get the SVG element from the paper
				const attributePaperView = paper.findViewByModel(attributeViews.get(attribute.id));
				// Get the length of the attribute text element
				var attributeNameWidth = attributePaperView.selectors.attributeLabel.firstChild.textLength.baseVal.value + attrMargin + attrPadding;
				// Keep track of the largest length
				if(attributeNameWidth > maxAttributeWidth) { maxAttributeWidth = attributeNameWidth; }
			});

			if(classNameWidth > maxAttributeWidth) {
				classElementView.model.attributes.attrs.classAttributeRect.width = (classNameWidth);
				classElementView.resize();
			} else { // maxAttributeWidth is greater
				classElementView.model.attributes.attrs.classAttributeRect.width = (maxAttributeWidth);
				classElementView.resize();
			}
			centerAndResizeAttributeViewsOnClass(imlClassModel, imlStructuralModel, paper);
		} else if(imlRelation) {
			var imlRelationView = graph.getCell(imlRelation.id);

			imlStructuralModel.classes.forEach(imlClass => {
				if(imlClass.name.localeCompare(newValue) == 0) {
					newValue = imlClass.id;
					if(propertyName.localeCompare("Source") == 0) {
						imlRelationView.source({ id: newValue });
					} else {
						imlRelationView.target({ id: newValue });
					}
				}
			});
			
			if(imlRelation instanceof ImlBoundedRelation) {
				imlRelation.updatePropertyByString(propertyName, newValue);
				var d1 = imlRelationView.labels()[0].position.distance;
				var o1 = imlRelationView.labels()[0].position.offset;
				var d2 = imlRelationView.labels()[1].position.distance;
				var o2 = imlRelationView.labels()[1].position.offset;
				imlRelationView.labels([{
					attrs: {
						text: {
							text: imlRelation.name,
						},
					},
					position: {
						distance: d1,
						offset: o1,
					},
				},{
					attrs: {
						text: {
							text: '[' + imlRelation.lowerBound + '..' + imlRelation.upperBound + ']',
						},
					},
					position: {
						distance: d2,
						offset: o2,
					},
				}]);

				if(imlRelation.source.localeCompare(imlRelation.destination) == 0) {
					var imlClassView = graph.getCell(imlRelation.source);						
					var classX = imlClassView.position().x;
					var classY = imlClassView.position().y;
					var width = imlClassView.attributes.attrs.classAttributeRect.width;
					var height = imlClassView.attributes.attrs.classAttributeRect.height;
					
					imlRelationView.vertices([
						new g.Point(classX+(parseFloat(width)/2), classY-40),
						new g.Point(classX-60, classY-40),
						new g.Point(classX-60, classY+(parseFloat(height)/2))
					]);
					
					
					imlClassView.embed(imlRelationView);

				}
				else{
					if(undoSelf)
						imlRelationView.vertices([]);
					
					var targetClass = graph.getCell(imlRelationView.attributes.target);
					if (targetClass.attributes.embeds){
						var index = targetClass.attributes.embeds.indexOf(imlRelationView.id);
						if (index > -1)
							targetClass.attributes.embeds.splice(index,1);
					}
					var sourceClass = graph.getCell(imlRelationView.attributes.source);
					if (sourceClass.attributes.embeds){
						var index = sourceClass.attributes.embeds.indexOf(imlRelationView.id);
						if (index > -1)
							sourceClass.attributes.embeds.splice(index,1);
					}
				}

			} else { // Then it is an inheritance relation and we must check for self relation.
				const relationSourceId = imlRelationView.source().id;
				const relationTargetId = imlRelationView.target().id;
				if(relationSourceId.localeCompare(relationTargetId) == 0) {
					imlRelationView.source( { id: imlRelation.source } );
					imlRelationView.target( { id: imlRelation.destination } );
					printProperties(paper.findViewByModel(imlRelation));
				} else {
					imlRelation.source = relationSourceId;
					imlRelation.destination = relationTargetId;
				}
			}
		}
		//if the attribute is what has changed, recreate the table contents with new values
		if(imlAttribute || imlRelation || imlClass){
			 printProperties(highlightedElement[0]);
		}
		else {
			showModelProperties();
		}
		redrawRelations();
		previousValue = [{property: propertyName, value: prevValue}];
		newActionValue = [{property : propertyName, value: newValue}];
		for(var i = 0; i < secondPrev.length; i++){
			previousValue.push(secondPrev[i]);
			newActionValue.push(secondNext[i]);
		}
		//specific situation caused by the double execution on change of dropdowns such as type
		if(
			(tableCellValueHolder != "" && propertyName.localeCompare("Type")!=0) || 
			(tableCellValueHolder == "" && propertyName.localeCompare("Type")==0)
		)
			undoStack.push(new ImlAction(ImlActionType.TABLE_CHANGE, target, targetType, previousValue, newActionValue));
		
		// Reset the temp variables at the end of the edit process
		tableCellValueHolder = "";
		// Reset sets highlight to adjust for any resizing
		resetHighlights();
		if(instanceEditor)
			dynamicConformance();
	}catch (error) {
		//display error message: commented out until the table focus error can be fixed
        //window.alert(error);
		
		propertyValue.empty();
		if(tableCellValueHolder.localeCompare(IMLEmptyValue)==0)
			propertyValue.text("");
		else
			propertyValue.text(tableCellValueHolder);
		
		printProperties(highlightedElement[0]);
		
		tableCellValueHolder = "";

		var msg = error.toString();
		msg = msg.replace("Error: ", "");
        swal("IML Error", msg, "error");
    }
        
    
}

function getClassIDByName(className){
	var found = null;
	imlStructuralModel.classes.forEach(curClass =>{
		if (curClass.name.localeCompare(className)==0)
			found = curClass.id;
	});
	return found;
}

function validFileName(fileName){
	if (!fileName.endsWith('.iml'))
		fileName = fileName + '.iml';
	
	if (fileName.match(/^[^ ][\w,\s-()]+\.iml$/gm))
		return fileName;
	else
		return null;
	
}


function newConform(importFileElement){
	readMetaModel(importFileElement);
	
}

function valPrint(imlAttribute){
	
	if (!(Array.isArray(imlAttribute.value))){
		if (imlAttribute.value)
			return imlAttribute.value;
		else
			return "";
	}
	else if (imlAttribute.value.length > 5){
		return imlAttribute.type + "[" + imlAttribute.value.length + "]";
	}
	else{
		var valString = "[";
		for (var index = 0; index < imlAttribute.value.length; index++) { 
			if(imlAttribute.type == ImlType.STRING){valString +='"';}
			valString += imlAttribute.value[index];
			if(imlAttribute.type == ImlType.STRING){valString +='"';}
			if(index != imlAttribute.value.length -1){valString += ",";}
		}
		valString +="]";
		return valString;
	}
}

/**
 * Uses the JointJs Cell object to retrieve the corresponding object from the backend. Depending on the object,
 * the correct set of properties is printed to the properties table.
 * 
 * @param {joint.dia.Cell} cellView 
 */
function printProperties(cellView) {
	if(cellView){
		var isEditable;
		if (instanceEditor)
			isEditable = 'uneditableCell"';
		else
			isEditable = 'editableCell" onclick="edit(this)';
		
		propertiesTableString = "";
		const imlClass = imlStructuralModel.classes.get(cellView.model.id);
		if(imlClass) {
			// Create table body
			propertiesTableString +=    
										'<tr>' +
											'<td class="propertyTableCell uneditableCell">Name</td> <td id="textProperty" class="propertyTableCell ' + isEditable + '">' + imlClass.name + '</td>' +
										'</tr>' +
										'<tr>' +
											'<td class="propertyTableCell uneditableCell">Abstract</td> <td id="booleanProperty" class="propertyTableCell ' + isEditable + '">' + String(imlClass.isAbstract).toUpperCase() + '</td>' +
										'</tr>';
		}

		const imlAttribute = attributes.get(cellView.model.id);

		if(imlAttribute) {
			// Create table body
			propertiesTableString += 
										'<tr>' +
											'<td class="propertyTableCell uneditableCell">Visibility</td> <td id="visibilityProperty" class="propertyTableCell ' + isEditable + '">' + imlAttribute.visibility + '</td>' +
										'</tr>' +
										'<tr>' +
											'<td class="propertyTableCell uneditableCell">Name</td> <td id="textProperty" class="propertyTableCell ' + isEditable + '">' + imlAttribute.name + '</td>' +
										'</tr>' +
										'<tr>' +
											'<td class="propertyTableCell uneditableCell">Type</td> <td id="typeProperty" class="propertyTableCell ' + isEditable + '">' + imlAttribute.type + '</td>' +
										'</tr>'+
										'<tr>' +
												'<td class="propertyTableCell uneditableCell">Lower Bound</td> <td id="numberProperty" class="propertyTableCell ' + isEditable + '">' + imlAttribute.lowerBound + '</td>' +
											'</tr>' +
											'<tr>' +
												'<td class="propertyTableCell uneditableCell">Upper Bound</td> <td id="numberProperty" class="propertyTableCell ' + isEditable + '">' + imlAttribute.upperBound + '</td>' +
											'</tr>';
										//use dropdown for value of boolean
										//KEEP COPIED OUT FOR NOW SO WE CAN REVERT IF WE DECIDE
										//if (imlAttribute.type == "BOOLEAN"){
										//	propertiesTableString += 
										//	'<tr>' +
										//		'<td class="propertyTableCell uneditableCell">Value</td> <td id="booleanProperty" class="propertyTableCell editableCell" onclick="edit(this)">' + imlAttribute.value + '</td>' +
										//	'</tr>';
										//}
										//else{
											propertiesTableString +=
											'<tr>' +
												'<td class="propertyTableCell uneditableCell">Value</td> <td id="valueProperty" class="propertyTableCell editableCell" onclick="edit(this)">';
											
											propertiesTableString += valPrint(imlAttribute); 
											propertiesTableString += '</td>' +
											'</tr>';
										//}
		}

		const imlRelation = imlStructuralModel.relations.get(cellView.model.id);
		
		if(imlRelation) {
			if(imlRelation instanceof ImlInheritance) {
				// Create table body
				propertiesTableString += 
											'<tr>' +
												'<td class="propertyTableCell uneditableCell">Source</td> <td id="classProperty" class="propertyTableCell ' + isEditable + '">' + imlStructuralModel.classes.get(imlRelation.source).name + '</td>' +
											'</tr>' +
											'<tr>' +
												'<td class="propertyTableCell uneditableCell">Destination</td> <td id="classProperty" class="propertyTableCell ' + isEditable + '">' + imlStructuralModel.classes.get(imlRelation.destination).name + '</td>' +
											'</tr>';
			} else {
				propertiesTableString += 
											'<tr>' +
												'<td class="propertyTableCell uneditableCell">Name</td> <td id="textProperty" class="propertyTableCell ' + isEditable + '">' + imlRelation.name + '</td>' +
											'</tr>' +
											'<tr>' +
											'<td class="propertyTableCell uneditableCell">Source</td> <td id="classProperty" class="propertyTableCell ' + isEditable + '">' + imlStructuralModel.classes.get(imlRelation.source).name + '</td>' +
											'</tr>' +
											'<tr>' +
											'<td class="propertyTableCell uneditableCell">Destination</td> <td id="classProperty" class="propertyTableCell ' + isEditable + '">' + imlStructuralModel.classes.get(imlRelation.destination).name + '</td>' +
											'</tr>' +
											'<tr>' +
												'<td class="propertyTableCell uneditableCell">Lower Bound</td> <td id="numberProperty" class="propertyTableCell ' + isEditable + '">' + imlRelation.lowerBound + '</td>' +
											'</tr>' +
											'<tr>' +
												'<td class="propertyTableCell uneditableCell">Upper Bound</td> <td id="numberProperty" class="propertyTableCell ' + isEditable + '">' + imlRelation.upperBound + '</td>' +
											'</tr>';
			}
		}

		$('#properties').html(propertiesTableString);
	}
	else
		showModelProperties();
}

/**
 * This function saves the model to the server and database.
 * @param {String} fileName The name of the model file.
 * @param {XML} content The XML content of the file.
 */
function saveModel(fileName, content) {
	//need to send fileName, content
	//make ajax call
	let settings = {
		url: 'http://iml.cec.miamioh.edu/scripts/saveModel.php/model',
		method: 'POST',
		headers: {
		  'Content-Type': 'application/json',
		},
		data: JSON.stringify({
		  fileName: fileName,
		  content: content
		}),
	  }; //end settings
	  //make ajax call
	  $.ajax(settings).done( async function (response) {
		let status = JSON.parse(response).status;
		let jsondata = JSON.parse(response).msg;
		if(status === 'fail') {
			//console.log("fail on saving model");
			//sweet alert indicating fail
			swal({
				title: "Fail on Saving Model",
				text: "Try again",
				icon: "error",
				closeOnClickOutside: true
			  });
		} else {
			//console.log("success!");
			//sweet alert indicating success
			swal({
				title: "Model Saved",
				icon: "success",
				closeOnClickOutside: true
			  });
		}
	  }); //end ajax settings
} //end saveModel