/**
 * Helper method to add each palette icon on load.
 */
function addPaletteIcons() {
    // The table used to implement the palette was automatically generated. This created a style tag inline with the table.
	
    // Style tag created for table
    var html = "";
    html += '<style type="text/css">';
	html += '.tg  {border-collapse:collapse;border-spacing:0;}';
	html += '.tg td{font-family:Arial, sans-serif;font-size:14px;padding:10px 5px;border-width:1px;overflow:hidden;word-break:normal;border-color:black;}';
	html += '.tg th{font-family:Arial, sans-serif;font-size:14px;font-weight:normal;padding:10px 5px;border-width:1px;overflow:hidden;word-break:normal;border-color:black;}';
	html += '.tg .tg-xwyw{text-align:center;vertical-align:bottom}';
    html += '</style>';
    
    if(instanceEditor){
		var colCount = 0;
		html += '<table class="tg">';
		html += '<tr>';
		var conformClasses = targetMetaModel.classes;
		conformClasses.forEach(curClass =>{
			if (colCount == 4){
				html += '</tr>';
				html += '<tr>';
				colCount = 0;
			}

			if(curClass.isAbstract.toString().localeCompare("false")==0){
				html += '<td class="tg-xwyw"><img id="uc:' + curClass.name + '" width="110px" class="paletteIcon" draggeable="true" ondragstart="drag(this, event)" onclick="addUserClassModelToGraph(200,150,this)" src="Resources/ClassModelIcon.svg"><br>'+curClass.name+'</td>';
				colCount++;
			}
		});

		var conformRels = targetMetaModel.relations;
		conformRels.forEach(curRel =>{
			if (colCount == 4){
				html += '</tr>';
				html += '<tr>';
				colCount = 0;
			}
			if(curRel instanceof ImlComposition) {
				html += '<td class="tg-xwyw"><img id="com:' + curRel.name + '" width="110px" class="paletteIcon" draggeable="true" ondragstart="drag(this, event)" onclick="addUserRelationToGraphClickEvent(this)" src="Resources/compositionArrowIcon.svg"><br>'+curRel.name+'</td>';
				colCount++;
			}
			else if(curRel instanceof ImlReference) {
				html += '<td class="tg-xwyw"><img id="ref:' + curRel.name + '" width="110px" class="paletteIcon" draggeable="true" ondragstart="drag(this, event)" onclick="addUserRelationToGraphClickEvent(this)" src="Resources/referenceArrowIcon.svg"><br>'+curRel.name+'</td>';
				colCount++;
			}
		});
		
		html += '</tr>';
		html += '</table>';
		
	}
	else{
		// Adds class icon to palette. Makes the element draggable. Calls drag to save the data for the drop event.
		html += '<table class="tg">';
		html += '<tr>';
		html += '<td class="tg-xwyw"><img id="classIcon" width="110px" class="paletteIcon" draggeable="true" ondragstart="drag(this, event)" onclick="addClassModelToGraph()" src="Resources/ClassModelIcon.svg"><br>Class</td>';
		html += '<td class="tg-xwyw"><img id="attributeIcon" width="110px" class="paletteIcon" draggeable="true" ondragstart="drag(this, event)" onclick="addAttributeToGraphClickEvent(this)" src="Resources/attributeIcon.png"><br>Attribute</td>';
		html += '<td></td>';
		html += '</tr>';
		html += '<tr>';
		html += '<td class="tg-xwyw"><img id="inheritanceIcon" width="110px" class="paletteIcon" draggeable="true" ondragstart="drag(this, event)" onclick="addRelationToGraphClickEvent(this)" src="Resources/InheritanceArrowIcon.svg"><br>Inheritance</td>';
		html += '<td class="tg-xwyw"><img id="compositionIcon" width="110px" class="paletteIcon" draggeable="true" ondragstart="drag(this, event)" onclick="addRelationToGraphClickEvent(this)" src="Resources/compositionArrowIcon.svg"><br>Composition</td>';
		html += '<td class="tg-xwyw"><img id="referenceIcon" width="110px" class="paletteIcon" draggeable="true" ondragstart="drag(this, event)" onclick="addRelationToGraphClickEvent(this)" src="Resources/referenceArrowIcon.svg"><br>Reference</td>';
		html += '</tr>';
		html += '</table>';
	}
	
	$("#paletteIcons").html(html);

}

/**
 * Called by "Import Existing Model..." to accept .iml file. 
 * This method handles the file uploading events.
 * 
 * @param {Input<file>} elemId 
 */
function downloadModelFile(elemId) {
    // Code provided by from StackOverflow answer: https://stackoverflow.com/a/6463467
    var elem = document.getElementById(elemId);
    if(elem && document.createEvent) {
        var evt = document.createEvent("MouseEvents");
        evt.initEvent("click", true, false);
        elem.dispatchEvent(evt);
    }
 }

 /**
  * Called by the input element onchange event, signifying a file has been upload.
  * This method reads the text of the upload file.
  * 
  * @param {Input<file>} importFileElement 
  */
function readFile(importFileElement) {
    // Code for reading file text provided by Javascript.info: https://javascript.info/file
	if(graph.getElements().filter(function(e1){return e1.attributes.type!="iml.Point";}).length != 0) {
        swal({
		  title: "Proceed?",
		  text: 'Model Elements are present in the IML Editor, by loading a new model, all unsaved progress will be lost. Do you wish to continue?',
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
				readHelper(importFileElement);
			}
			else
				return;
		})
    }
	else{
		readHelper(importFileElement);
	}
}

function readHelper(importFileElement){
	var reader = new FileReader();
	var inputFile = importFileElement.files[0]; // Always be an array of 1, input element does not have multiple tag
	instanceEditor = false;
	reader.readAsText(inputFile);

	reader.onload = function() {
		var fileType = inputFile.name.split('.')[1];
		if(fileType.localeCompare("iml") == 0) {
			importModel(reader.result, inputFile.name, false, graph);
		} else {
			window.alert('File uploads must be of type ".iml"');
		}
	}

	reader.onerror = function() {
		console.log(reader.error);
	};
}


function readMetaModel(importFileElement) {
	var fileContents;   
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function(){
		if (xhr.readyState == 4) {
			fileContents = xhr.responseText; 
			importModel(fileContents, "MOLEGA.iml", true, graph);
			createInstance();
		}
	};
	xhr.open("GET","scripts/MOLEGA.iml"); 
	xhr.send();
}

/**
 * Called after the text of the input file has been read.
 * This method establishes the backend for the import model.
 * 
 * @param {String} xmlString 
 */
function importModel(xmlString, fileName, isMeta, graph) {

	inputModel = new ImlStructuralModel();
    if (!isMeta)
		graph.removeCells(graph.getElements().filter(function(e1){return e1.attributes.type!="iml.Point";}));
	
    try {
        xmlDoc = $.parseXML(xmlString);
        $xml = $(xmlDoc);

        $structuralModelXml = $xml.find("StructuralModel"); 
        if($structuralModelXml) { // Check for a structural model in the iml file
            // Read in classes
			
			if(isMeta && imlStructuralModel.conformsTo.localeCompare(fileName)!=0 && imlStructuralModel.conformsTo.localeCompare("IML Definition")!=0)
				throw new Error("The selected meta-model file (" + fileName + ") does not match the required meta-model (" + imlStructuralModel.conformsTo +")");
			
			$xml.find("StructuralModel").each(function(index,model){
				
				if(model.hasAttribute('routingMode'))
					routingMode = model.attributes["routingMode"].value;
				else
					routingMode = 'simpleRoute';
				
				inputModel.setName(model.attributes["name"].value);
				inputModel.setConformsTo(model.attributes["conformsTo"].value);
			});
			inputModel.setFileName(fileName);
			

			
			if(isMeta){
				$("#conformanceBlock").show();
				$("#conformIcon").show();
				$("#check").removeClass("disabled").find("a").attr("onclick", "reportConformance()");
				$("#create").addClass("disabled").find("a").attr("onclick", "return false;");
			}
			else {
				if (routingMode.localeCompare('simpleRoute')==0){
					simpleRoute();
					$('#routingOptions > li > a').removeClass('selected');
					$('#simpleRoute').addClass('selected');
				}
				else if (routingMode.localeCompare('orthogonalRoute')==0){
					orthogonalRoute();
					$('#routingOptions > li > a').removeClass('selected');
					$('#orthogonalRoute').addClass('selected');
				}
				else if (routingMode.localeCompare('manhattanRoute')==0){
					manhattanRoute();
					$('#routingOptions > li > a').removeClass('selected');
					$('#manhattanRoute').addClass('selected');
				}
				else if (routingMode.localeCompare('metroRoute')==0){
					metroRoute();
					$('#routingOptions > li > a').removeClass('selected');
					$('#metroRoute').addClass('selected');
				}
				if(inputModel.conformsTo.localeCompare("MOLEGA.iml")==0){
					createInstance();
				}
				else {
					throw new Error("This is not a MOLEGA formatted model file.");
				}
			}
            $classes = $structuralModelXml.find("Classes"); 
            $classes.find("Class").each(function(index, xmlClass) {

				//check to see if the class has attributes for name, isAbstract, x, y 
				if(!xmlClass.hasAttribute("name")){
					throw new Error('The ' + ordinal_suffix_of(index+1) + ' IML Class is missing the "name" attribute.');
				}
				if(!xmlClass.hasAttribute("isAbstract")){
					throw new Error('IML Class ' + xmlClass.attributes["name"].value + ' is missing the "isAbstract" attribute.');
				}
				if(!xmlClass.hasAttribute("x")){
					throw new Error('IML Class ' + xmlClass.attributes["name"].value + ' is missing the "x" attribute.');
				}
				if(!xmlClass.hasAttribute("y")){
					throw new Error('IML Class ' + xmlClass.attributes["name"].value + ' is missing the "y" attribute.');
				}
				if(!xmlClass.hasAttribute("id")){
					throw new Error('IML Class ' + xmlClass.attributes["name"].value + ' is missing the "id" attribute.');
				}
			
				//check to see if the class name attribute is blank
				var className = xmlClass.attributes["name"].value;
				if(!className) {
					throw new Error('The ' + ordinal_suffix_of(index+1) + ' IML Class is missing the "name" attribute.');
				}
				//check to make sure the class name is unique
				if(!instanceEditor && duplicateName(className,inputModel.classes)){
					throw new Error('There are duplicate definitions of Class ' + className + '; IML requires unique class names');
				}
				//check to make sure the isAbstract value is not blank, and a valid boolean value
				var isAbstract = xmlClass.attributes["isAbstract"].value;
				if(!isAbstract) {
					throw new Error('Class "' + className + '" is missing the "isAbstract" attribute.');
				}
				if(!validBool(isAbstract)){
					throw new Error('Class "' + className + '" has an invalid Boolean value for the isAbstract attribute.')
				}
				if (isAbstract == "TRUE")
					isAbstract = true;
				else
					isAbstract = false;
				
				var classID = xmlClass.attributes["id"].value;
				
				// Implement the class view to generate the unique id
				var imlClassView = new ImlClassElement();
				imlClassView.attr({
					classNameLabel: {
						text: className, 
					},
				});
				
				imlClassView.id = classID;
				imlClassView.attributes.id = classID;
				
				
				var imlClass = new ImlClass(className, new Map(), new Map(), isAbstract, classID);
				inputModel.addClass(imlClass);
				
				//check to make sure x and y positions are valid positional data then position the class
				var xPos = Number(xmlClass.attributes["x"].value);
				var yPos = Number(xmlClass.attributes["y"].value);
				if(!validPosition(xPos)){
					throw new Error('Class "' + className + '" has an invalid Integer value for the X position attribute.')
				}
				if(!validPosition(yPos)){
					throw new Error('Class "' + className + '" has an invalid Integer value for the Y position attribute.')
				}
				imlClassView.position(xPos, yPos);
				
				if(imlClass.isAbstract == true){
					imlClassView.attributes.attrs.classNameLabel.text = '<< ' + imlClass.name + ' >>';
					imlClassView.attributes.attrs.classAttributeRect.fill = 'rgba(224,224,224,0.6)';
					imlClassView.attributes.attrs.classNameLabel.fontStyle =	'italic';
				}
				else{ 
					imlClassView.attributes.attrs.classNameLabel.text = imlClass.name;
					imlClassView.attributes.attrs.classAttributeRect.fill = 'rgba(204,229,255,1.0)';
					imlClassView.attributes.attrs.classNameLabel.fontStyle =	'normal';
				}
				if(!isMeta)
					graph.addCell(imlClassView);

				// Implement Attributes in the class
				createAttributes($(xmlClass).find("Attribute"), imlClass, imlClassView, isMeta, graph);

				if(!isMeta)
					centerAndResizeAttributeViewsOnClass(imlClass, inputModel, paper);
            });
			
			
            createRelations($structuralModelXml, isMeta, graph, instanceEditor);
            
			
			if(isMeta)
				targetMetaModel = inputModel;
			else {
				imlStructuralModel = inputModel;

				// Move any overlapping classes.
				inputModel.classes.forEach(imlClass => {
					var imlClassView = graph.getCell(imlClass.id);
					var elementsUnder = graph.findModelsInArea(imlClassView.getBBox()).filter(el => el !== imlClassView);
					endPosition = imlClassView.attributes.position;
								
					if (overlap(elementsUnder)) {
						// an overlap found, revert the position
						const { x, y } = findNewPos(graph, imlClassView);
						var dx = endPosition.x - x;
						var dy = endPosition.y - y;
						
						if (imlClassView.attributes.embeds){
							moveClassAttributes(graph, imlClassView, dx, dy, inputModel);
						}
						
						imlClassView.position(x, y);
						endPosition.x = x;
						endPosition.y = y;
						
					}
				});
			}
			
			if(isMeta){
				addPaletteIcons();
				dynamicConformance();
			}
			else{
				if (!instanceEditor) 
					addPaletteIcons();
			}
			
			showModelProperties();
			undoStack = [];
        }
    } catch (error) {
		graph.removeCells(graph.getElements().filter(function(e1){return e1.attributes.type!="iml.Point";}));
		imlStructuralModel = new ImlStructuralModel();
		if (isMeta){
			var msg = error.toString().replace("Error: ", "") + " - Import has been aborted";
			swal("Import Error", msg, "error");
			targetMetaModel = new ImlStructuralModel();
			instanceEditor = false;
			addPaletteIcons();
			showModelProperties();
			$("#conformBlock").hide();
			$("#conformIcon").hide();
			$("#create").removeClass("disabled").find("a").attr("onclick", "createInstance()");
			$("#check").addClass("disabled").find("a").attr("onclick", "return false;");
			$("#conformanceErrors").hide();
		}
		else{
			var msg = error.toString().replace("Error: ", "") + " - Import has been aborted";
			swal("Import Error", msg, "error");
		}
    }

}

function createAttributes(xmlAttribute, imlClass, imlClassView, isMeta, graph) {
	// Need option to create runtime vars vs view elements.
    
    xmlAttribute.each(function(index, xmlAttribute) {

        var imlAttributeView = new ImlAttributeElement();
    
		//check each required attribute to ensure it is included in the file
        if(!xmlAttribute.hasAttribute("name")){
			throw new Error('The ' + ordinal_suffix_of(index+1) + ' attribute of IML Class ' + imlClass.name + ' is missing the "name" attribute.');
		}
		if(!xmlAttribute.hasAttribute("visibility")){
			throw new Error('IML Class '  + imlClass.name  + ' is missing the "visibility" attribute on Attribute ' + xmlAttribute.attributes["name"].value);
		}
		if(!xmlAttribute.hasAttribute("type")){
			throw new Error('IML Class '  + imlClass.name  + ' is missing the "type" attribute on Attribute ' + xmlAttribute.attributes["name"].value);
		}
		if(!xmlAttribute.hasAttribute("lowerBound")){
			throw new Error('IML Class '  + imlClass.name  + ' is missing the "lowerBound" attribute on Attribute ' + xmlAttribute.attributes["name"].value);
		}
		if(!xmlAttribute.hasAttribute("upperBound")){
			throw new Error('IML Class '  + imlClass.name  + ' is missing the "upperBound" attribute on Attribute ' + xmlAttribute.attributes["name"].value);
		}
		if(!xmlAttribute.hasAttribute("position")){
			throw new Error('IML Class '  + imlClass.name  + ' is missing the "position" attribute on Attribute ' + xmlAttribute.attributes["name"].value);
		}
		
		//ensure the attribute name is not blank
        var attributeName = xmlAttribute.attributes["name"].value;
        if(!attributeName) {
            throw new Error("Attribute missing name.");
        }
		//ensure the attribute name does not exist within the class already
		if(duplicateName(attributeName,imlClass.attributes)){
			throw new Error('There are duplicate definitions of attribute ' + attributeName + ' in Class ' + imlClass.name + '; IML requires unique attribute names');
		}

		//ensure that the attribute visibility and type are non-blank and valid values
        var attributeVisibility = xmlAttribute.attributes["visibility"].value;
        var attributeType = xmlAttribute.attributes["type"].value;
        if(!(attributeVisibility && attributeType)) {
            throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' is missing the visibility or type');
        }
		if (!validVisibility(attributeVisibility)){
			throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' has an invalid visibility value');
		}
		if (!validType(attributeType)){
			throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' has an invalid type value');
		}
		
		//check attribute value
		var attributeValue = xmlAttribute.attributes["value"];
        if(attributeValue) { //if not blank
            var tempVal = xmlAttribute.attributes["value"].value;
			if(tempVal.charAt(0)=='['){
				tempVal = tempVal.replace("[","");
				tempVal = tempVal.replace("]","");
				tempVal = tempVal.split(",");
				for (var i = 0; i < tempVal.length; i++){
					if(!validAssignment(tempVal[i],attributeType)){
						throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' has an invalid value for data type ' + attributeType);
					}
				}
				attributeValue = tempVal;
			}
			else{
				//ensure the type of the value is valid for the selected type
				if(!validAssignment(tempVal,attributeType)){
					throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' has an invalid value for data type ' + attributeType);
				}
				//assign the value based on the type (integers and doubles become strings representing ints and floats)
				if (attributeType == "INTEGER"){
					attributeValue = parseInt(tempVal,10).toString();
				}
				else if (attributeType == "DOUBLE"){
					attributeValue = parseFloat(tempVal).toString();
				}
				//all others (string and boolean) are copied directly
				else{
					attributeValue = tempVal;
				}
			}
        }
		else{ //if the value is blank, assign empty string
			attributeValue = '';
		}
		//if non-mandatory field not included, ensure to also assign empty string
		if(!xmlAttribute.hasAttribute("position")){
			attributeValue = '';
		}
		
		//create attribute object
        var imlAttribute = new ImlAttribute(
            xmlAttribute.attributes["visibility"].value,
            xmlAttribute.attributes["name"].value,
            xmlAttribute.attributes["type"].value,
            attributeValue,
            index + 1,
            imlAttributeView.id
        );
    
		
		//ensure valid values for lowerBound, upperBound, and position (including valid bound ranges)
		var lowerBound = xmlAttribute.attributes["lowerBound"].value;
		var upperBound = xmlAttribute.attributes["upperBound"].value;
		var position = xmlAttribute.attributes["position"].value;
		if (!lowerBound){
			throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' is missing a value for lower bound');
		}
		if (!upperBound){
			throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' is missing a value for upper bound');
		}
		if (!position){
			throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' is missing a value for position');
		}
		if (!validLowerBound(lowerBound)){
			throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' has an invalid value for lower bound');
		}
		if (!validUpperBound(upperBound)){
			throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' has an invalid value for upper bound');
		}
		if (!validPosition(position)){
			throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' has an invalid value for position');
		}
		if (!validBounds(lowerBound,upperBound)){
			throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' has an invalid range of values for its bounds (typically lower is not less than upper)');
		}
		
		
        imlAttribute.lowerBound = lowerBound;
        imlAttribute.upperBound = upperBound;
		
		//add the attribute to the class
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
		
		if(!isMeta)
			graph.addCell(imlAttributeView);            // Makes the attribute visible
		
        // Update class model height to account for new element
        const classAttributeRectHeight = parseInt(imlClassView.attributes.attrs.classAttributeRect.height);
        imlClassView.attributes.attrs.classAttributeRect.height = (classAttributeRectHeight + attrHeightOffset);

    });

}

function createRelations($structuralModelXml, isMeta, graph, instanceEditor) {
    // Read in relations
    $relations = $structuralModelXml.find("Relations");
    $relations.find("Relation").each(function(index, xmlRelation) {
		
        //check to ensure mandatory attributes of all relations are included
		if(!xmlRelation.hasAttribute("source")){
			throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation of the input model is missing the "source" attribute.');
		}
		if(!xmlRelation.hasAttribute("destination")){
			throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation of the input model is missing the "destination" attribute.');
		}
		if(!xmlRelation.hasAttribute("type")){
			throw new Error('The relation from' + xmlRelation.attributes["source"].value + ' to ' + xmlRelation.attributes["destination"].value + ' is missing the "type" attribute.');
		}
				
		//ensure the relation type is valid
		var relationType = xmlRelation.attributes["type"].value;
		if (!validRelationType(relationType)){
			throw new Error('The relation from ' + xmlRelation.attributes["source"].value + ' to ' + xmlRelation.attributes["destination"].value + ' has an invalid relation type.');
		}
		
		//for non inheritence relations
		if (!(relationType == ImlRelationType.INHERITENCE)){
			//ensure the named relation elements are present
			if(!xmlRelation.hasAttribute("name")){
				throw new Error('The relation from' + xmlRelation.attributes["source"].value + ' to ' + xmlRelation.attributes["destination"].value + ' is missing the "name" attribute.');
			}
			if(!xmlRelation.hasAttribute("lowerBound")){
				throw new Error('The relation ' + xmlRelation.attributes["name"].value + ' is missing the "lowerBound" attribute.');
			}
			if(!xmlRelation.hasAttribute("upperBound")){
				throw new Error('The relation ' + xmlRelation.attributes["name"].value + ' is missing the "upperBound" attribute.');
			}
			if(!xmlRelation.hasAttribute("nameDistance")){
				throw new Error('The relation ' + xmlRelation.attributes["name"].value + ' is missing the "nameDistance" attribute.');
			}
			if(!xmlRelation.hasAttribute("nameOffset")){
				throw new Error('The relation ' + xmlRelation.attributes["name"].value + ' is missing the "nameOffset" attribute.');
			}
			if(!xmlRelation.hasAttribute("boundDistance")){
				throw new Error('The relation ' + xmlRelation.attributes["name"].value + ' is missing the "boundDistance" attribute.');
			}
			if(!xmlRelation.hasAttribute("boundOffset")){
				throw new Error('The relation ' + xmlRelation.attributes["name"].value + ' is missing the "boundOffset" attribute.');
			}
		}
		
		//ensure that both source and targets are set
		imlSourceClassName = xmlRelation.attributes["source"].value;
        imlTargetClassName = xmlRelation.attributes["destination"].value
        if( !(imlSourceClassName && imlTargetClassName)) {          
			throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation in the iml file is missing a source or target attribute definition.');
        }

		//find the source and target class objects based on the name
        var imlSourceClass;
        var imlTargetClass;
        inputModel.classes.forEach(imlClassModel => {
            if(xmlRelation.attributes["source"].value.localeCompare(imlClassModel.id) == 0) {
                imlSourceClass = imlClassModel;
            }
            if(xmlRelation.attributes["destination"].value.localeCompare(imlClassModel.id) == 0) {
                imlTargetClass = imlClassModel;
            }
        });
		//check to make sure the source and targets were found (exist)
        if(!imlSourceClass) {
			throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation in the iml file has a source class that is not defined.');
        }
        if(!imlTargetClass) {
            throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation in the iml file has a target class that is not defined.');
        }

		
        //finish importing inheritence relations
        if(ImlRelationType.INHERITENCE == relationType){
				//ensure that inheritence relations do not have the same source and target
				if (imlSourceClass.name == imlTargetClass.name){
					throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation (type: Inheritance) has the same source and target classes; this is an invalid Inheritance relation.');
				}
				//ensure the inheritence does not already exist
				if (duplicateInheritence(imlSourceClass, inputModel.relations)){
					throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation (type: Inheritance) has the same source as an existing Inheritance relation; multiline inheritance is not allowed.');
				}
				let visited = [imlSourceClass.id];
				if(circularInherit(inputModel, imlTargetClass.id, visited)){
					throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation (type: Inheritance) would create a cycle of inheritance.');
				}
				//create and add the relation
                relationTempView = new ImlInheritanceElement();
                relationTempModel = new ImlInheritance(imlTargetClass.id, imlSourceClass.id, relationTempView.id);
                relationTempView.source({ id : imlSourceClass.id });
                relationTempView.target({ id : imlTargetClass.id });
                if(!isMeta)
					graph.addCell(relationTempView);
                inputModel.addRelation(relationTempModel);        
        } 
		else { // finish importing named relations
            //ensure bounds are set and valid
			
			var lowerBound = xmlRelation.attributes["lowerBound"].value;
            var upperBound = xmlRelation.attributes["upperBound"].value;
			if( !(lowerBound && upperBound) ) {
                throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation in the iml file is missing a lower or upper bound');
            }
			if(!validBounds(lowerBound,upperBound)){
				throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation in the iml file has an invalid specifcation of bounds');
			}
			
			//ensure the name is set relation is not a duplicate of an existing relation (two checks: name of attribute, and name of relation)
            var name = xmlRelation.attributes["name"].value;
			if(!name) {
                throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation in the iml file is missing a name');
            }
			if(!instanceEditor){
				if(duplicateName(name,imlSourceClass.attributes)){
					throw new Error('The relation ' + name + ' with a source Class ' + imlSourceClass.name + ' has the same name as one of the Class attributes; IML requires unique attribute and relation names');
				}
				if(duplicateRelation(name, imlSourceClass, inputModel.relations)){
					throw new Error('The relation ' + name + ' with a source Class ' + imlSourceClass.name + ' has the same name as one of the Class relations; IML requires unique attribute and relation names');
				}
			}
			if (lowerBound > 0){	
				let visited = [imlSourceClass.id];
				if (relationType == ImlRelationType.COMPOSITION && imlSourceClass.id == imlTargetClass.id){
					throw new Error('The relation ' + name + ' is a self-relation with a required lower bound; self-relations cannot be required (the lower bound must not be greater than 0)');
				} else if(circularReference(inputModel, imlTargetClass.id, visited)){
					throw new Error('Adding relation ' + name + ' results in a cycle of required relations.');
				}
				
			}
            
			//ensure that positional data for labels are set and valid
			var nameOffset = Number(xmlRelation.attributes["nameOffset"].value);
			if(!validDouble(nameOffset)){
				throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation in the iml file has an invalid nameOffset specifcation');
			}
            var boundOffset = Number(xmlRelation.attributes["boundOffset"].value);
            if(!validDouble(boundOffset)){
				throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation in the iml file has an invalid boundOffset specifcation');
			}
			var nameDistance = Number(xmlRelation.attributes["nameDistance"].value);
            if(!validDouble(nameDistance)){
				throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation in the iml file has an invalid nameDistance specifcation');
			}
			var boundDistance = Number(xmlRelation.attributes["boundDistance"].value);
            if(!validDouble(boundDistance)){
				throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation in the iml file has an invalid boundDistance specifcation');
			}
			
            
			//create and add the relation
            var relationTempView; 
            var relationTempModel;
            if(ImlRelationType.COMPOSITION == relationType) {
                relationTempView = new ImlCompositionElement();
                relationTempModel = new ImlComposition(imlTargetClass.id, imlSourceClass.id, name, lowerBound, upperBound, relationTempView.id);
            } else if(ImlRelationType.REFERENCE == relationType) {
                relationTempView = new ImlReferenceElement();
                relationTempModel = new ImlReference(imlTargetClass.id, imlSourceClass.id, name, lowerBound, upperBound, relationTempView.id);
            }
            inputModel.addRelation(relationTempModel);

            relationTempView.source({ id : imlSourceClass.id });
            relationTempView.target({ id : imlTargetClass.id });
			
			
			if(!isMeta){
				graph.addCell(relationTempView);
				if (relationTempView.attributes.source.id == relationTempView.attributes.target.id){
					imlClassView = graph.getCell(relationTempView.attributes.source.id);
					
					var classX = imlClassView.position().x;
					var classY = imlClassView.position().y;
					var width = imlClassView.attributes.attrs.classAttributeRect.width;
					var height = imlClassView.attributes.attrs.classAttributeRect.height;
					
					var link = graph.getCell(relationTempView.id);
					link.vertices([
						new g.Point(classX+(parseFloat(width)/2), classY-40),
						new g.Point(classX-60, classY-40),
						new g.Point(classX-60, classY+(parseFloat(height)/2))
					]);
					
					relationTempView.attr("g.marker-vertices/display", "none");
					
					imlClassView.embed(relationTempView);
				}
				
				


				if(!instanceEditor){
					relationTempView.labels([{
						attrs: {
							text: {
								text: name,
							},
						},
						position: {
							distance: nameDistance,
							offset: nameOffset,
						},
					},{
						attrs: {
							text: {
								text: '[' + lowerBound + '..' + upperBound + ']',
							},
						},
						position: {
							distance: boundDistance,
							offset: boundOffset,
						},
					}]);
				}
				else{
					relationTempView.labels([{
						attrs: {
							text: {
								text: name,
							},
						},
						position: {
							distance: nameDistance,
							offset: nameOffset,
						},
					}]);

				}

				
			}

        }
		if(!isMeta){
			var points = [];
			$(xmlRelation).find("Point").each(function(index, xmlPoint) {
				var xPos = xmlPoint.attributes["x"].value;
				var yPos = xmlPoint.attributes["y"].value;
				var point = new g.Point(parseFloat(xPos), parseFloat(yPos));
				points.push(point);
			});
			var link = graph.getCell(relationTempView.id);
			link.vertices(points);
		}
    });
}

/**
 * Retrieves the IML Attributes in XML form to create IML Attributes and add them to
 * the corresponding IML Class.
 * 
 * @param {*} xmlClass 
 * @param {*} inputModel 
 */
function createRuntimeAttributes(xmlClass, inputModel) {

	imlClass = inputModel.classes.get(xmlClass.attributes["id"].value);

	$(xmlClass).find('Attribute').each(function(index, xmlAttribute) {
    
		// Check each required attribute to ensure it is included in the file
        if(!xmlAttribute.hasAttribute("name")){
			throw new Error('The ' + ordinal_suffix_of(index+1) + ' attribute of IML Class ' + imlClass.name + ' is missing the "name" attribute.');
		}
		if(!xmlAttribute.hasAttribute("visibility")){
			throw new Error('IML Class '  + imlClass.name  + ' is missing the "visibility" attribute on Attribute ' + xmlAttribute.attributes["name"].value);
		}
		if(!xmlAttribute.hasAttribute("type")){
			throw new Error('IML Class '  + imlClass.name  + ' is missing the "type" attribute on Attribute ' + xmlAttribute.attributes["name"].value);
		}
		if(!xmlAttribute.hasAttribute("lowerBound")){
			throw new Error('IML Class '  + imlClass.name  + ' is missing the "lowerBound" attribute on Attribute ' + xmlAttribute.attributes["name"].value);
		}
		if(!xmlAttribute.hasAttribute("upperBound")){
			throw new Error('IML Class '  + imlClass.name  + ' is missing the "upperBound" attribute on Attribute ' + xmlAttribute.attributes["name"].value);
		}
		if(!xmlAttribute.hasAttribute("position")){
			throw new Error('IML Class '  + imlClass.name  + ' is missing the "position" attribute on Attribute ' + xmlAttribute.attributes["name"].value);
		}
		
		// Ensure the attribute name is not blank
        var attributeName = xmlAttribute.attributes["name"].value;
        if(!attributeName) {
            throw new Error("Attribute missing name.");
		}
		
		// Ensure the attribute name does not exist within the class already
		if(duplicateName(attributeName,imlClass.attributes)){
			throw new Error('There are duplicate definitions of attribute ' + attributeName + ' in Class ' + imlClass.name + '; IML requires unique attribute names');
		}

		// Ensure that the attribute visibility and type are non-blank and valid values
        var attributeVisibility = xmlAttribute.attributes["visibility"].value;
        var attributeType = xmlAttribute.attributes["type"].value;
        if(!(attributeVisibility && attributeType)) {
            throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' is missing the visibility or type');
        }
		if (!validVisibility(attributeVisibility)) {
			throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' has an invalid visibility value');
		}
		if (!validType(attributeType)) {
			throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' has an invalid type value');
		}
		
		// Check attribute value
		var attributeValue = xmlAttribute.attributes["value"];
        if(attributeValue) { // If not blank
            var tempVal = xmlAttribute.attributes["value"].value;
			if(tempVal.charAt(0)=='['){
				tempVal = tempVal.replace("[","");
				tempVal = tempVal.replace("]","");
				tempVal = tempVal.split(",");
				for (var i = 0; i < tempVal.length; i++) {
					if(!validAssignment(tempVal[i],attributeType)) {
						throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' has an invalid value for data type ' + attributeType);
					}
				}
				attributeValue = tempVal;
			} else {
				// Ensure the type of the value is valid for the selected type
				if(!validAssignment(tempVal,attributeType)) {
					throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' has an invalid value for data type ' + attributeType);
				}
				// Assign the value based on the type (integers and doubles become strings representing ints and floats)
				if (attributeType == "INTEGER") {
					attributeValue = parseInt(tempVal,10).toString();
				}
				else if (attributeType == "DOUBLE") {
					attributeValue = parseFloat(tempVal).toString();
				}
				// All others (string and boolean) are copied directly
				else {
					attributeValue = tempVal;
				}
			}
        }
		else { // If the value is blank, assign empty string
			attributeValue = '';
		}
		// If non-mandatory field not included, ensure to also assign empty string
		if(!xmlAttribute.hasAttribute("position")) {
			attributeValue = '';
		}

		// Ensure valid values for lowerBound, upperBound, and position (including valid bound ranges)
		var lowerBound = xmlAttribute.attributes["lowerBound"].value;
		var upperBound = xmlAttribute.attributes["upperBound"].value;
		var position = xmlAttribute.attributes["position"].value;
		if (!lowerBound){
			throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' is missing a value for lower bound');
		}
		if (!upperBound){
			throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' is missing a value for upper bound');
		}
		if (!position){
			throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' is missing a value for position');
		}
		if (!validLowerBound(lowerBound)){
			throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' has an invalid value for lower bound');
		}
		if (!validUpperBound(upperBound)){
			throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' has an invalid value for upper bound');
		}
		if (!validPosition(position)){
			throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' has an invalid value for position');
		}
		if (!validBounds(lowerBound,upperBound)){
			throw new Error('Attribute "' + attributeName + '" of Class ' + imlClass.name + ' has an invalid range of values for its bounds (typically lower is not less than upper)');
		}

		// Create view simply for uuid.
		var imlAttributeView = new ImlAttributeElement();

		// Create attribute object
		var imlAttribute = new ImlAttribute(
			xmlAttribute.attributes["visibility"].value,
			xmlAttribute.attributes["name"].value,
			xmlAttribute.attributes["type"].value,
			attributeValue,
			index + 1,
			imlAttributeView.id,
			upperBound,
			lowerBound
		);

        imlClass.addAttribute(imlAttribute);

	});

}

/**
 * Adds classes to a model runtime data structure.
 * 
 * @param {XMLDocument} $classes Classes of import model in XML
 * @param {ImlStructuralModel} inputModel Model runtime data structure.
 */
function createRuntimeClasses($classes, inputModel, isInstanceModel) {
	$classes.find("Class").each(function(index, xmlClass) {
		// Check to see if the class has attributes for name, isAbstract, x, y 
		if(!xmlClass.hasAttribute("name")){
			throw new Error('The ' + ordinal_suffix_of(index+1) + ' IML Class is missing the "name" attribute.');
		}
		if(!xmlClass.hasAttribute("isAbstract")){
			throw new Error('IML Class ' + xmlClass.attributes["name"].value + ' is missing the "isAbstract" attribute.');
		}
		if(!xmlClass.hasAttribute("x")){
			throw new Error('IML Class ' + xmlClass.attributes["name"].value + ' is missing the "x" attribute.');
		}
		if(!xmlClass.hasAttribute("y")){
			throw new Error('IML Class ' + xmlClass.attributes["name"].value + ' is missing the "y" attribute.');
		}
		if(!xmlClass.hasAttribute("id")){
			throw new Error('IML Class ' + xmlClass.attributes["name"].value + ' is missing the "id" attribute.');
		}
			
		// Check to see if the class name attribute is blank
		var className = xmlClass.attributes["name"].value;
		if(!className) {
			throw new Error('The ' + ordinal_suffix_of(index+1) + ' IML Class is missing the "name" attribute.');
		}

		// Check to make sure the class name is unique
		if(!isInstanceModel && duplicateName(className, inputModel.classes)){
			throw new Error('There are duplicate definitions of Class ' + className + '; IML requires unique class names');
		}

		// Check to make sure the isAbstract value is not blank, and a valid boolean value
		var isAbstract = xmlClass.attributes["isAbstract"].value;
		if(!isAbstract) {
			throw new Error('Class "' + className + '" is missing the "isAbstract" attribute.');
		}
		if(!validBool(isAbstract)){
			throw new Error('Class "' + className + '" has an invalid Boolean value for the isAbstract attribute.')
		}
		if (isAbstract == "TRUE") {
			isAbstract = true;
		} else {
			isAbstract = false;
		}

		var classID = xmlClass.attributes["id"].value;

		// Intialize class object and add to the model data structure.
		var imlClass = new ImlClass(className, new Map(), new Map(), isAbstract, classID);
		inputModel.addClass(imlClass);

		createRuntimeAttributes(xmlClass, inputModel);
	});
}

/**
 * 
 * @param {XMLDocument} $relations 
 * @param {ImlStructuralModel} inputModel 
 * @param {boolean} isInstanceModel 
 */
function createRuntimeRelations($relations, inputModel, isInstanceModel) {

	$relations.find("Relation").each(function(index, xmlRelation) {
		
        // Check to ensure mandatory attributes of all relations are included
		if(!xmlRelation.hasAttribute("source")) {
			throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation of the input model is missing the "source" attribute.');
		}
		if(!xmlRelation.hasAttribute("destination")) {
			throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation of the input model is missing the "destination" attribute.');
		}
		if(!xmlRelation.hasAttribute("type")) {
			throw new Error('The relation from' + xmlRelation.attributes["source"].value + ' to ' + xmlRelation.attributes["destination"].value + ' is missing the "type" attribute.');
		}
				
		// Ensure the relation type is valid
		var relationType = xmlRelation.attributes["type"].value;
		if (!validRelationType(relationType)) {
			throw new Error('The relation from ' + xmlRelation.attributes["source"].value + ' to ' + xmlRelation.attributes["destination"].value + ' has an invalid relation type.');
		}
		
		// For non inheritence relations
		if (!(relationType == ImlRelationType.INHERITENCE)) {
			// Ensure the named relation elements are present
			if(!xmlRelation.hasAttribute("name")) {
				throw new Error('The relation from' + xmlRelation.attributes["source"].value + ' to ' + xmlRelation.attributes["destination"].value + ' is missing the "name" attribute.');
			}
			if(!xmlRelation.hasAttribute("lowerBound")) {
				throw new Error('The relation ' + xmlRelation.attributes["name"].value + ' is missing the "lowerBound" attribute.');
			}
			if(!xmlRelation.hasAttribute("upperBound")) {
				throw new Error('The relation ' + xmlRelation.attributes["name"].value + ' is missing the "upperBound" attribute.');
			}
			if(!xmlRelation.hasAttribute("nameDistance")) {
				throw new Error('The relation ' + xmlRelation.attributes["name"].value + ' is missing the "nameDistance" attribute.');
			}
			if(!xmlRelation.hasAttribute("nameOffset")) {
				throw new Error('The relation ' + xmlRelation.attributes["name"].value + ' is missing the "nameOffset" attribute.');
			}
			if(!xmlRelation.hasAttribute("boundDistance")) {
				throw new Error('The relation ' + xmlRelation.attributes["name"].value + ' is missing the "boundDistance" attribute.');
			}
			if(!xmlRelation.hasAttribute("boundOffset")) {
				throw new Error('The relation ' + xmlRelation.attributes["name"].value + ' is missing the "boundOffset" attribute.');
			}
		}
		
		// Ensure that both source and targets are set
		imlSourceClassName = xmlRelation.attributes["source"].value;
        imlTargetClassName = xmlRelation.attributes["destination"].value
        if( !(imlSourceClassName && imlTargetClassName)) {          
			throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation in the iml file is missing a source or target attribute definition.');
		}

		// Find the source and target class objects based on the name
        var imlSourceClass;
        var imlTargetClass;
        inputModel.classes.forEach(imlClassModel => {
            if(xmlRelation.attributes["source"].value.localeCompare(imlClassModel.id) == 0) {
                imlSourceClass = imlClassModel;
            }
            if(xmlRelation.attributes["destination"].value.localeCompare(imlClassModel.id) == 0) {
                imlTargetClass = imlClassModel;
            }
		});
		
		// Check to make sure the source and targets were found (exist)
        if(!imlSourceClass) {
			throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation in the iml file has a source class that is not defined.');
        }
        if(!imlTargetClass) {
            throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation in the iml file has a target class that is not defined.');
		}
		
		// Finish importing inheritence relations
        if(ImlRelationType.INHERITENCE == relationType){
			// Ensure that inheritence relations do not have the same source and target
			if (imlSourceClass.name == imlTargetClass.name){
				throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation (type: Inheritance) has the same source and target classes; this is an invalid Inheritance relation.');
			}

			// Ensure the inheritence does not already exist
			if (duplicateInheritence(imlSourceClass, inputModel.relations)){
				throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation (type: Inheritance) has the same source as an existing Inheritance relation; multiline inheritance is not allowed.');
			}
			let visited = [imlSourceClass.id];
			if(circularInherit(inputModel, imlTargetClass.id, visited)){
				throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation (type: Inheritance) would create a cycle of inheritance.');
			}

			// Create and add the relation
			relationTempModel = new ImlInheritance(imlTargetClass.id, imlSourceClass.id, relationTempView.id);
			inputModel.addRelation(relationTempModel);        
		} 
		else { // Finish importing named relations
			// Ensure bounds are set and valid
			
			var lowerBound = xmlRelation.attributes["lowerBound"].value;
			var upperBound = xmlRelation.attributes["upperBound"].value;
			if( !(lowerBound && upperBound) ) {
				throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation in the iml file is missing a lower or upper bound');
			}
			if(!validBounds(lowerBound, upperBound)){
				throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation in the iml file has an invalid specifcation of bounds');
			}
			
			// Ensure the name is set relation is not a duplicate of an existing relation (two checks: name of attribute, and name of relation)
			var name = xmlRelation.attributes["name"].value;
			if(!name) {
				throw new Error('The ' + ordinal_suffix_of(index+1) + ' relation in the iml file is missing a name');
			}

			if(!isInstanceModel){
				if(duplicateName(name, imlSourceClass.attributes)){
					throw new Error('The relation ' + name + ' with a source Class ' + imlSourceClass.name + ' has the same name as one of the Class attributes; IML requires unique attribute and relation names');
				}
				if(duplicateRelation(name, imlSourceClass, inputModel.relations)){
					throw new Error('The relation ' + name + ' with a source Class ' + imlSourceClass.name + ' has the same name as one of the Class relations; IML requires unique attribute and relation names');
				}
			}

			if (lowerBound > 0){	
				let visited = [imlSourceClass.id];
				if (relationType == ImlRelationType.COMPOSITION && imlSourceClass.id == imlTargetClass.id){
					throw new Error('The relation ' + name + ' is a self-relation with a required lower bound; self-relations cannot be required (the lower bound must not be greater than 0)');
				} else if(circularReference(inputModel, imlTargetClass.id, visited)){
					throw new Error('Adding relation ' + name + ' results in a cycle of required relations.');
				}
				
			}

			// Create relation and add it to input model.
			var relationTempModel;
			if(ImlRelationType.COMPOSITION == relationType) {
				relationTempView = new ImlCompositionElement();
				relationTempModel = new ImlComposition(imlTargetClass.id, imlSourceClass.id, name, lowerBound, upperBound, relationTempView.id);
			} else if(ImlRelationType.REFERENCE == relationType) {
				relationTempView = new ImlReferenceElement();
				relationTempModel = new ImlReference(imlTargetClass.id, imlSourceClass.id, name, lowerBound, upperBound, relationTempView.id);
			}
			
			inputModel.addRelation(relationTempModel);
		}

	});
}