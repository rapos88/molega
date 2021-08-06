function addAttributes(imlClass, model) {
    var attrsString = "";

    imlClass.relationIds.forEach(relationId => {
        var relation = model.relations.get(relationId);
        if(relation.source.localeCompare(imlClass.id) == 0) {   
            if(relation instanceof ImlInheritance) {
                var parent = model.classes.get(relation.destination);
                attrsString += addAttributes(parent, model);
            } else {
                attrsString += relation.name + ': " + this.' + relation.name + ' + ", ';
            }
        }
    });

    imlClass.attributes.forEach(attribute => {
        attrsString += attribute.name + ': " + this.' + attribute.name + ' + ", ';
    });

    return attrsString;
}

function capitalize(lowerCaseString) {
    const capitalName = lowerCaseString.slice(0,1).toUpperCase() + lowerCaseString.slice(1);
    return capitalName;
}

function classAsciiArt(imlClass, model){
	var attributes = [];
	imlClass.attributes.forEach(attr =>{
		var attrString = '[' + attr.lowerBound + '..' + attr.upperBound + '] ' + attr.print();
		attributes.push(attrString);
	})
	imlClass.relationIds.forEach(relationId =>{
		var rel = model.relations.get(relationId);
		if((rel.source.localeCompare(imlClass.id)==0) && !(rel instanceof ImlInheritance)){
			var targetClass = model.classes.get(rel.destination);
			var relString = '[' + rel.lowerBound + '..' + rel.upperBound + '] + ' + rel.name + ' : ' + targetClass.name;
			attributes.push(relString);
		}
	})
	
	var max = 0;
	for (var i = 0; i < attributes.length; i++){
		if (attributes[i].length > max)
			max = attributes[i].length;
	}
	if (max == 0)
		max = imlClass.name.length;
	
	var horBar = ''
	for (var i = 0; i < max + 6; i++)
		horBar += '=';
	
	var diff = max - imlClass.name.length;
	var pad = diff / 2;
	
	var formattedName = ' * || ';
	for (var i = 0; i < pad; i++)
		formattedName += ' ';
	formattedName += imlClass.name;
	for (var i = 0; i < pad; i++)
		formattedName += ' ';
	
	if((diff % 2) != 0)
		formattedName += '||\n'
	else
		formattedName += ' ||\n'
	var string = '/*\n * ' + horBar + '\n';
	string += formattedName;
	string += ' * ' + horBar + '\n';
	
	for (var i = 0; i < attributes.length; i++){
		var diff = max - attributes[i].length;
		var pad = '';
		for (var j = 0; j < diff; j++)
			pad += ' ';
		string += ' * || ' + attributes[i] + pad + ' ||\n';
	}
	string += ' * ' + horBar + '\n */\n';
	
	return string;
}

function generateAttributes(imlClass, model){
	var attributes = new Map();

	imlClass.relationIds.forEach(relId =>{
		var relation = model.relations.get(relId);
		if(relation.source.localeCompare(imlClass.id) == 0) {   
            if(relation instanceof ImlInheritance) {
                var parent = model.classes.get(relation.destination);
				var inheritedAttrs = generateAttributes(parent, model);
				attributes = mergeAttributeMapsWithOverload(attributes,inheritedAttrs);
			}
		} 
	});
	
	imlClass.attributes.forEach(attr =>{
		attributes.set(attr.id,attr);
	});
	return attributes;
}

function generateRelations(imlClass, model){
	var relations = new Map();

	imlClass.relationIds.forEach(relId =>{
		var relation = model.relations.get(relId);
		if(relation.source.localeCompare(imlClass.id) == 0) {   
            if(relation instanceof ImlInheritance) {
                var parent = model.classes.get(relation.destination);
				var inheritedRels = generateRelations(parent, model);
				relations = mergeAttributeMapsWithOverload(relations,inheritedRels);
			}
			else{
				relations.set(relation.id,relation);
			}
		} 
	});
	
	return relations;
}

function createToString(imlClass, model) {
	return '\tpublic String toString() {\n\t\treturn this.prettyPrint(0);\n\t}\n\n' + createPrettyPrint(imlClass, model);
}

function createPrettyPrint(imlClass, model) {
	const tabLoopMain = '\n\t\tfor(int i = 0; i < indent; i++)\n\t\t\tpretty += ' +'"' + '\\t' +'";\n\n';
	const tabLoopAttr = '\n\t\tfor(int i = 0; i < indent+1; i++)\n\t\t\tpretty += ' +'"' + '\\t' +'";\n\n';
	const header = '\tprotected String prettyPrint(int indent) {\n\t\tString pretty = \"\";\n';
    
	var body = tabLoopMain;
	body += '\t\tpretty += "' + imlClass.name + ': { \\n\";\n';
	var attrList = generateAttributes(imlClass,model);
	attrList.forEach(attr =>{
        body += tabLoopAttr;
        var printArrStr = '\t\tpretty += "' + attr.name + ': " + this.' + attr.name + ' + "\\n";\n';
        if(attr.type == ImlType.STRING) { 
            if(attr.upperBound > 1 || attr.upperBound == '*') { // Array
                printArrStr = '\t\tpretty += "' + attr.name + ': [\\"" + String.join("\\", \\"", this.' + attr.name + ') + "\\"]" + "\\n";\n';
            } else { // Single
                printArrStr = '\t\tpretty += "' + attr.name + ': \\"" + this.' + attr.name + ' + "\\"\\n";\n';
            }
        }
        body += printArrStr;
	});
	
	var relList = generateRelations(imlClass,model);
	relList.forEach(rel =>{
		body += tabLoopAttr;
		body += '\t\tpretty += "' + rel.name + ': [\\n";\n';
		body += '\t\tfinal StringBuilder ' + rel.name + 'String = new StringBuilder();\n';
		if (rel.upperBound > 1 || rel.upperBound == "*")
			body += '\t\tthis.' + rel.name + '.forEach((x) -> '+ rel.name + 'String.append(x.prettyPrint(indent+2)));\n';
		else
			body += '\t\t' + rel.name + 'String.append(this.' + rel.name + '.prettyPrint(indent+2));\n';
		body += '\t\tpretty += ' + rel.name + 'String.toString();\n';
		body += tabLoopAttr;
		body += '\t\tpretty += "]\\n";\n';
	});
	
	
	body += tabLoopMain;
	body += '\t\tpretty += "}\\n";\n\t\treturn pretty;\n';
	return header + body + '\t}\n';
	
}

function formatType(typeString) {
    const javaTypeFormat = typeString.slice(0,1) + typeString.slice(1).toLowerCase();
    return javaTypeFormat;
}

function getAttributeValue(attribute) {
    var formattedValue = '';
    const upperBound = Number(attribute.upperBound);
    if(attribute.value) {
        if(upperBound > 1 || attribute.upperBound == '*') { // Array
            if(attribute.type == ImlType.STRING) { // String Array
                var valueFormattedForList = '';
                var value = attribute.value;
                // Check if not represented as array. Make it an array if not.
                if(!Array.isArray(value)) {
                    value = [value];
                }
                
                value.forEach(arrValue => {
                    valueFormattedForList += '"' + arrValue + '",';
                });

                valueFormattedForList = valueFormattedForList.substring(0, valueFormattedForList.length - 1);
                formattedValue = 'new ArrayList<String>(Arrays.asList(' + valueFormattedForList + '))';
            } else { // Other Array
                const arrayListType = capitalize(attribute.type.toLowerCase());
                formattedValue = 'new ArrayList<' + arrayListType + '>(Arrays.asList(' + attribute.value + '))';
            }
        } else { // Single
            formattedValue = attribute.value;
            if(attribute.type == ImlType.STRING) {
                formattedValue = '"' + formattedValue + '"';
            } else if(attribute.type == ImlType.BOOLEAN) {
                formattedValue = formattedValue.toLowerCase();
            }
        }
    } else { // Use default value
        if(upperBound > 1 || attribute.upperBound == '*') { // Array
            formattedValue = 'new ArrayList<' + capitalize(attribute.type.toLowerCase()) + '>()';
        } else { // Single
            if(attribute.type == ImlType.STRING) {
                formattedValue = '""';
            } else if(attribute.type == ImlType.BOOLEAN) {
                formattedValue = 'false';
            } else if(attribute.type == ImlType.INTEGER) {
                formattedValue = '0';
            } else if(attribute.type == ImlType.DOUBLE) {
                formattedValue = '0.0';
            }
        }
    }

    return formattedValue;
}

function getObjectAttributesWithDefaults(imlClass, model) {
    var defaultInstantiations = '\n';

    // Call the default constructor of parent. This should handle inherited default values.
    // defaultInstantiations += '\t\tsuper();\n'

    imlClass.attributes.forEach(attribute => {
        var defaultValue = '';
        if(attribute.lowerBound == 0) { // Optional attribute
            if(attribute.upperBound > 1 || attribute.upperBound == '*') { // Array
                if(attribute.type == ImlType.STRING) {
                    defaultValue = 'new ArrayList<String>()';
                } else if(attribute.type == ImlType.BOOLEAN) {
                    defaultValue = 'new ArrayList<Boolean>()';
                } else if(attribute.type == ImlType.INTEGER) {
                    defaultValue = 'new ArrayList<Integer>()';
                } else if(attribute.type == ImlType.DOUBLE) {
                    defaultValue = 'new ArrayList<Double>()';
                }
            } else { // Single
                if(attribute.type == ImlType.STRING) {
                    defaultValue = '""';
                } else if(attribute.type == ImlType.BOOLEAN) {
                    defaultValue = 'false';
                } else if(attribute.type == ImlType.INTEGER) {
                    defaultValue = '0';
                } else if(attribute.type == ImlType.DOUBLE) {
                    defaultValue = '0.0';
                }
            }

            defaultInstantiations += '\t\tthis.' + attribute.name + ' = ' + defaultValue + ';\n';
        }
    });

    imlClass.relationIds.forEach(relationId => {
        const relation = model.relations.get(relationId);
        if(relation instanceof ImlBoundedRelation && relation.source == imlClass.id) {
            if(relation.lowerBound == 0) { // Optional bounded relation
                const objectClass = model.classes.get(relation.destination);
                var defaultValue = '';
                if(relation.upperBound > 1 || relation.upperBound == '*') { // Array
                    defaultValue = 'new ArrayList<' + objectClass.name + '>()';
                } else { //Single
                    defaultValue = 'new ' + objectClass.name + '()';
                }

                defaultInstantiations += '\t\tthis.' + relation.name + ' = ' + defaultValue + ';\n';
            }
        }
    });

    defaultInstantiations += '\t';

    // No optional attributes were found so set to empty for better styling.
    if(defaultInstantiations == '\n\t') {
        defaultInstantiations = ' ';
    }

    return defaultInstantiations;
}

function generateConstructorArgs(imlClass, model) {
    var argsStr = "";

    imlClass.relationIds.forEach(relationId => {
        var relation = model.relations.get(relationId);
        if(relation.source.localeCompare(imlClass.id) == 0) {   
            if(relation instanceof ImlInheritance) {
                var parent = model.classes.get(relation.destination);
                newArgsStr = generateConstructorArgs(parent, model);
                // Ensure there are attributes to print or else a lonely comma will be inserted.
                if(newArgsStr) {
                    argsStr += newArgsStr + ', ';
                }
            } else {
                attrClass = model.classes.get(relation.destination);
                type = attrClass.name;
                if(relation.upperBound > 1 || relation.upperBound == '*') {
                    type = 'ArrayList<' + type + '>';
                }
                argsStr += type + ' ' + relation.name + ', ';
            }
        }
    });
    
    imlClass.attributes.forEach(attribute => {
        type = formatType(attribute.type);
        if(attribute.upperBound > 1 || attribute.upperBound == '*') {
            type = 'ArrayList<' + type + '>';
        }
        argsStr += type + ' ' + attribute.name + ', ';
    });

    return argsStr.substring(0, argsStr.length - 2);
}

function generateConstructorSuperMethod(imlClass, model) {
    var argsStr = "";

    imlClass.relationIds.forEach(relationId => {
        var relation = model.relations.get(relationId);
        if(relation.source.localeCompare(imlClass.id) == 0) {   
            if(relation instanceof ImlInheritance) {
                var parent = model.classes.get(relation.destination);
                argsStr += generateConstructorSuperMethodHelper(parent, model) + ', ';
            }
        }
    });

    return "\t\tsuper(" + argsStr.substring(0, argsStr.length - 2) + ");"; 
}

function generateConstructorSuperMethodHelper(imlClass, model) {
    var argsStr = "";

    imlClass.relationIds.forEach(relationId => {
        var relation = model.relations.get(relationId);
        if(relation.source.localeCompare(imlClass.id) == 0) {   
            if(relation instanceof ImlInheritance) {
                var parent = model.classes.get(relation.destination);
                argsStr += generateConstructorSuperMethodHelper(parent, model) + ', ';
            } else {
                argsStr += relation.name + ', ';
            }
        }
    });

    imlClass.attributes.forEach(attribute => {
        argsStr += attribute.name + ', ';
    });

    return argsStr.substring(0, argsStr.length - 2);
}

function generateInstanceModelJavaCode(model, metamodel) {
    var instanceClassCode = '';
    var arrayFound = false;

    instanceClassCode += 'public class ' + model.name + ' {\n';
    instanceClassCode += '\tpublic static void main(String args[]) {\n\n';
    instanceClassCode += '\t\t// Instantiate model objects.\n' ;   

    // Dictionary of classes seen, and the number of time that class has been created
    // key: name of class, value: number of classes created.
    var objectsSeen = {};

    // Dictionary to keep track of the varible name associated with an instance.
    // key: imlClass id, value: variable name
    var declaredInstances = {};

    // Declare class defaults
    model.classes.forEach(instance => {
        var variableName = instance.name.toLowerCase();
        if(objectsSeen[instance.name]) {
            // Increment amount of classes seen and append this number to name of instance.
            objectsSeen[instance.name]++;
            variableName += objectsSeen[instance.name];
        } else {
            objectsSeen[instance.name] = 1;
            variableName += '1';
        }

        var classInstance = '\t\t' + instance.name + ' ' + variableName + ' = new ' + instance.name + '();\n';
        instanceClassCode += classInstance;

        declaredInstances[instance.id] = variableName;
    });

    instanceClassCode += '\n\n';
    instanceClassCode += '\t\t// Set object attributes.\n';

    model.classes.forEach(instance => {
        const variableName = declaredInstances[instance.id];

        // Set primitive attributes
        instance.attributes.forEach(attribute => {
            var attributeValue = getAttributeValue(attribute);
            if(attribute.upperBound > 1 || attribute.upperBound == '*') {
                arrayFound = true;
            }

            // If Double, create Double object in case of int value.
            if(attribute.type == ImlType.DOUBLE) {
                attributeValue = 'Double.valueOf(' + attributeValue + ')';
            }

            var setAttributesCode = '\t\t' + variableName + '.set' + capitalize(attribute.name) + '(' + attributeValue + ');\n';
            instanceClassCode += setAttributesCode;
        });

        // Dictionary tracking initialized relation attributes. This is to avoid 
        // printing redundant code.
        // key: name of relation, value: imlClass id of source.
        var initializedRelations = {};

        // Initialize object arrays
        instance.relationIds.forEach(relationId => {
            const relation = model.relations.get(relationId);
            if(relation.source == instance.id && relation instanceof ImlBoundedRelation) {
                if(relation.upperBound > 1 || relation.upperBound == '*') { // Array
                    const relationSourceId = initializedRelations[relation.name];
                    // If the relation name does not exist as a key in the dictionary and,
                    // if the value at the key is not the instance id, then we have not initiatized this array
                    if(!relationSourceId || !(relationSourceId == instance.id)) {
                        // Initialize the array
                        arrayFound = true;
                        var objectType = '';

                        // Find the corresponding relation in the metamodel
                        metamodel.relations.forEach(metaRelation => {
                            if(metaRelation.name == relation.name) {
                                // Use the destination of the relation to decide the type of the arraylist.
                                const imlClass = metamodel.classes.get(metaRelation.destination);
                                objectType = imlClass.name;
                            }
                        });

                        const setObjectAttributeCode = '\t\t' + variableName + '.set' + capitalize(relation.name) + '(' + 
                            'new ArrayList<'+ objectType +'>()' +
                        ');\n';
                        
                        instanceClassCode += setObjectAttributeCode;

                        // Add relation to initializedRelations
                        initializedRelations[relation.name] = relation.source;
                    }
                }
            }
        });

        instanceClassCode += '\n';

    });

    instanceClassCode += '\n';
    instanceClassCode += '\t\t// Implement relations between model objects.\n';

    // Add Objects
    model.classes.forEach(instance => {
        const variableName = declaredInstances[instance.id];

        instance.relationIds.forEach(relationId => {
            const relation = model.relations.get(relationId);
            if(relation.source == instance.id && relation instanceof ImlBoundedRelation) {
                // Retrieve the variable name using the id provided in the relation object.
                const objectToAdd = declaredInstances[relation.destination];

                var addObjectCode = '\t\t' + variableName;;
                if(relation.upperBound > 1 || relation.upperBound == '*') { // Array
                    addObjectCode += '.get' + capitalize(relation.name) + '().add(' + objectToAdd + ');\n';
                } else { // Single
                    addObjectCode += '.set' + capitalize(relation.name) + '(' + objectToAdd + ');\n';
                }
                instanceClassCode += addObjectCode;
            }
        });
    });

    // Add array imports (if necessary) and package statement.
    if(arrayFound){
        instanceClassCode = 'import java.util.Arrays;\nimport java.util.ArrayList;\n\n' + instanceClassCode;
    }
    instanceClassCode =  'package iml.' + metamodel.name.toLowerCase() + ';\n\n' + instanceClassCode;

    // Close main method
    instanceClassCode += '\t}\n'
    // Close Class
    instanceClassCode += '}';
    return instanceClassCode;
}

function generateJavaCode(model, metamodel, isInstanceModel) {
    var javaFiles = new JSZip();
    var imlFolder = javaFiles.folder('iml');

    var structuralModel = model;
    if(isInstanceModel) {
        structuralModel = metamodel;
    }
    const structuralModelName = structuralModel.name.toLowerCase();
    var modelFolder = imlFolder.folder(structuralModelName);

    structuralModel.classes.forEach(imlClass => {
        var classCode = '';

        var arrayPresent = false;
        const arraysImport = 'import java.util.Arrays;\nimport java.util.ArrayList;\n\n'; // Add Array imports.
    
        // Initialize var for keeping track of getters/setters.
        var gettersCode = '\t// ======================================= Getters\n\n';
        var settersCode = '\t// ======================================= Setters\n\n';

        var abstract = ' ';
        if(imlClass.isAbstract) {
            abstract = ' abstract ';
        }

        // Determine if inheritance exists for this class.
        var extendsString = ' ';
        imlClass.relationIds.forEach(relationId => {
            var relation = structuralModel.relations.get(relationId);
            if(relation) {
                // Check relation type and if current class is the source of the relation.
                if(relation instanceof ImlInheritance && relation.source.localeCompare(imlClass.id) == 0) {
                    // Get the name of the "extended to" class.
                    const className = structuralModel.classes.get(relation.destination).name;
                    extendsString = ' extends ' + className + ' ';
                }
            }
        });

        // Class header line
        classCode += 'public' + abstract + 'class ' + imlClass.name + extendsString + '{\n\n';

        // Track constructor arguments and body
        var constructorBody = '';

        // Add code for primitive attributes.
        imlClass.attributes.forEach(imlAttribute => {
            var attributeCode = '';
            var type = formatType(imlAttribute.type);
            const visibility = imlAttribute.visibility.toLowerCase();
            const name = imlAttribute.name;
            const lowerBound = Number(imlAttribute.lowerBound);
            const upperBound = Number(imlAttribute.upperBound);

            var value = '';
            if(lowerBound == 0) { // Optional attribute
                if(upperBound == 1) { // Single
                    if(imlAttribute.value) {
                        if(imlAttribute.type == ImlType.STRING) {
                            value = ' = "' + imlAttribute.value + '"';
                        } else if(imlAttribute.type == ImlType.BOOLEAN) {
                            value = ' = ' + imlAttribute.value.toLowerCase();
                        } else {
                            value = ' = ' + imlAttribute.value;
                        }
                    }
                } else { // Array
                    arrayPresent = true;

                    // Update type to be an ArrayList of the proper type.
                    type = 'ArrayList<' + type + '>';

                    if(imlAttribute.value) {
                        value = ' = ' + type + '(Arrays.asList(';
                        imlAttribute.value.forEach(arrVal => {
                            if(imlAttribute.type == ImlType.STRING) {
                                value += '"' + arrVal + '",';
                            } else if(imlAttribute.type == ImlType.BOOLEAN) {
                                value += arrVal.toLowerCase() + ',';
                            } else {
                                value += arrVal + ',';
                            }
                        });

                        // Remove the trailing comma
                        value = value.substring(0, value.length - 1);
                        value += '))';
                    }
                }
            } else if(lowerBound > 0) { // Required attribute
                if(upperBound == 1) { // Single
                    if(imlAttribute.value) {
                        if(imlAttribute.type == ImlType.STRING) {
                            value = ' = "' + imlAttribute.value + '"';
                        } else if(imlAttribute.type == ImlType.BOOLEAN) {
                            value = ' = ' + imlAttribute.value.toLowerCase();
                        } else {
                            value = ' = ' + imlAttribute.value; // We can assume this value is correct due to error checking in the model editor
                        }
                    } else { // If no value provided then insert default value
                        if(imlAttribute.type == ImlType.STRING) {
                            value = ' = ""';
                        } else if(imlAttribute.type == ImlType.BOOLEAN) {
                            value = ' = false';
                        } else if(imlAttribute.type == ImlType.INTEGER) {
                            value = ' = 0';
                        } else if(imlAttribute.type == ImlType.DOUBLE) {
                            value = ' = 0.0';
                        }
                    }
                } else { // Array
                    arrayPresent = true;

                    // Update type to be an ArrayList of the proper type.
                    type = 'ArrayList<' + type + '>';
                    value += ' = new ' + type + '(Arrays.asList(';
                        
                    if(imlAttribute.value) {
                        // If there is a value, we can trust it to be correct due to validation done in the model editor.
                        // Exception: boolean values are stored as uppercase but must be lowercase for java.
                        imlAttribute.value.forEach(arrVal => {
                            if(imlAttribute.type == ImlType.STRING) {
                                value += '"' + arrVal + '",';
                            } else if(imlAttribute.type == ImlType.BOOLEAN) {
                                value += arrVal.toLowerCase() + ',';
                            } else {
                                value += arrVal + ',';
                            }
                        });
                    } else { // If no value provided then insert default values, up to the lower bound.
                        for(var i = 0; i < lowerBound; i++) {
                            if(imlAttribute.type == ImlType.STRING) {
                                value += '"",';
                            } else if(imlAttribute.type == ImlType.BOOLEAN) {
                                value += 'false,';
                            } else if(imlAttribute.type == ImlType.INTEGER) {
                                value += '0,';
                            } else if(imlAttribute.type == ImlType.DOUBLE) {
                                value += '0.0,';
                            }
                        }
                    }

                    // Remove the trailing comma
                    value = value.substring(0, value.length - 1);
                    value += '))';  
                }
            }
            // Add type and name of attribute for constructor to arguments and body.
            constructorBody += '\t\tthis.' + name + ' = ' + name + ';\n';

            // Generate javadoc comment for attribute.
            startComment = '\t/**\n';
            lowerBoundComment = '\t * @lowerBound ' + imlAttribute.lowerBound + '\n'; 
            upperBoundComment = '\t * @upperBound ' + imlAttribute.upperBound + '\n';
            endComment = '\t */\n'
            attributeCode += startComment + lowerBoundComment + upperBoundComment + endComment;
            attributeCode += '\t' + visibility + ' ' + type + ' ' + name + value + ';'; 

            classCode += attributeCode + '\n\n';

            // Generate getter for attribute
            var getterComment = '\t/**\n' + '\t * @return current value of ' + imlAttribute.name + '\n' + '\t */\n';
            var getter = '\tpublic ' + type + ' get' + capitalize(imlAttribute.name) + '() {\n';
            getter += '\t\treturn this.' + imlAttribute.name + ';\n';
            getter += '\t}\n\n';
            gettersCode += getterComment + getter;

            // Generate setter for attribute
            var setterComment = '\t/**\n' + '\t * @param ' + imlAttribute.name + ' Set value of ' + imlAttribute.name + '\n' + '\t */\n';
            var setter = '\tpublic void set' + capitalize(imlAttribute.name) + '('+ type + ' ' + imlAttribute.name + ') {\n';
            setter += '\t\tthis.' + imlAttribute.name + ' = ' + imlAttribute.name + ';\n';
            setter += '\t}\n\n';
            settersCode += setterComment + setter;
        });

        // Add code for Object attributes (Relations).
        imlClass.relationIds.forEach(relationId => {
            var relation = structuralModel.relations.get(relationId);
            // If the relation is a Composition or Reference and the relation's source is the current class.
            if(!(relation instanceof ImlInheritance) && relation.source.localeCompare(imlClass.id) == 0) {
                var attributeCode = '\tpublic ';

                const lowerBound = Number(relation.lowerBound);
                const upperBound = Number(relation.upperBound);
                var type = structuralModel.classes.get(relation.destination).name;

                if(lowerBound == 0) { // Optional attribute
                    if(upperBound == 1) { // Single
                        attributeCode += type + ' ';
                    } else { // Array
                        arrayPresent = true;
                        // Update type to be an ArrayList of the proper type.
                        type = 'ArrayList<' + type + '> ';
                        attributeCode += type;
                    }
                    attributeCode += relation.name;
                } else if (lowerBound > 0) { // Required attribute
                    if(upperBound == 1) { // Single
                        attributeCode += type + ' ' + relation.name;
                        attributeCode += ' = new ' + type + '()';
                        if(structuralModel.classes.get(relation.destination).isAbstract) {
                            attributeCode += '{}';
                        }
                    } else { // Array
                        arrayPresent = true;

                        type = 'ArrayList<' + type + '>';
                        attributeCode += type + ' ';
                        attributeCode += relation.name;
                        attributeCode += ' = new ' + type + ' (Arrays.asList(';
                        for(var i = 0; i < lowerBound; i++) {
                            // This uses the class name because 'type' has been update to be an array.
                            const originalType = structuralModel.classes.get(relation.destination).name;
                            attributeCode += 'new ' + originalType;
                            attributeCode += '()';
							if(structuralModel.classes.get(relation.destination).isAbstract) {
                                attributeCode += '{}';
                            }
							attributeCode += ', ';
                        }

                        // Remove the trailing comma and space.
                        attributeCode = attributeCode.substring(0, attributeCode.length - 2);
                        attributeCode += '))';
                    }
                }

                // Generate getter for relation attribute.
                var getterComment = '\t/**\n' + '\t * @return current value of ' + relation.name + '\n' + '\t */\n';
                var getter = '\tpublic ' + type + ' get' + capitalize(relation.name) + '() {\n';
                getter += '\t\treturn this.' + relation.name + ';\n';
                getter += '\t}\n\n';
                gettersCode += getterComment + getter;

                // Generate setter for relation attribute.
                var setterComment = '\t/**\n' + '\t * @param ' + relation.name + ' Set value of ' + relation.name + '\n' + '\t */\n';
                var setter = '\tpublic void set' + capitalize(relation.name) + '('+ type + ' ' + relation.name + ') {\n';
                setter += '\t\tthis.' + relation.name + ' = ' + relation.name + ';\n';
                setter += '\t}\n\n';
                settersCode += setterComment + setter;

                startComment = '\t/**\n';
                lowerBoundComment = '\t * @lowerBound ' + relation.lowerBound + '\n'; 
                upperBoundComment = '\t * @upperBound ' + relation.upperBound + '\n';
                endComment = '\t */\n'
                classCode += startComment + lowerBoundComment + upperBoundComment + endComment + attributeCode + ';\n\n';  

                // Add type and name of attribute for constructor to arguments and body.
                constructorBody += '\t\tthis.' + relation.name + ' = ' + relation.name + ';\n';
            }
        });


        // Generate constructor arguments
        var args = generateConstructorArgs(imlClass, structuralModel);
        var constructorCode = ""

        // If there are no arguments, do not generate constructor.
        if(args) {
            constructorCode = '\tpublic ' + imlClass.name + '(' + args + ') {\n';
            var superMethod = generateConstructorSuperMethod(imlClass, structuralModel);
            constructorCode += superMethod + '\n' + constructorBody;
            constructorCode += '\t}' + '\n\n';

            // If there is an array parameter in the constructor, we must include array imports.
            // A class could inherit an array attribute but not have any itself.
            if(args.includes("ArrayList") || args.includes("[]")) {
                arrayPresent = true;
            }
        }

        // Generate default constructor
        var defaultConstructorCode = '\t// Empty constructor to allow an object to be instantiated with default values.\n';
        const defaultInstantiations = getObjectAttributesWithDefaults(imlClass, structuralModel);
        defaultConstructorCode += '\tpublic ' + imlClass.name + '() {' + defaultInstantiations + '}\n';

        // Generate toString
        var toStringCode = createToString(imlClass, structuralModel);

        classCode += constructorCode;
        classCode += defaultConstructorCode;
        classCode += '\n\n' + toStringCode + '\n';
        if(imlClass.attributes.size > 0 || imlClass.relationIds.size > 0) {
            classCode += '\n' + gettersCode;
            classCode += '\n' + settersCode;
        }

        // Create destructor if necessary.
        var destructor = '';
        imlClass.relationIds.forEach(relationId => {
            var relation = structuralModel.relations.get(relationId);

            var body = '';
            if(relation instanceof ImlComposition && relation.source == imlClass.id) {
                // body = buildDestructorBody(imlClass)
                // Check for Inheritance in Composition target.


                // Add composition attributes to be destroyed.
                body += '\t\tthis.' + relation.name + ' = null;\n';
            } 

            if(body) {
                var comment = '\n\t/**\n';
                comment += '\t * Destructor for ' + imlClass.name + ' when composition relations are present.\n';
                comment += '\t * \n'
                comment += '\t * Composition relations are unique from reference relations because the object(s) in a composition\n';
                comment += '\t * relation cannot exist without the object that owns the relation. Therefore, when the object with\n';
                comment += '\t * a composition relation is destroyed, the object created by the composition relation must be destroyed as well.\n';
                comment += '\t */\n';
                destructor = comment + '\tprotected void finalize() throws Throwable {\n' + body + '\t}\n\n';
            }
        });

        classCode += destructor + '}';

        // Add package and imports
        if(arrayPresent) {
            classCode = arraysImport + classCode;
        }

        classCode = 'package iml.' + structuralModelName + ';\n\n' + classCode;

        classCode = classAsciiArt(imlClass, structuralModel) + '\n' + classCode + '\n\n';

        modelFolder.file(imlClass.name + '.java', classCode);
    });

    if(isInstanceModel) {
        instanceModelFileContent = generateInstanceModelJavaCode(model, metamodel);

        modelFolder.file(model.name + '.java', instanceModelFileContent);
    }

    return javaFiles;
}