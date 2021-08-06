/**
 *
 * 	This file is comprised of helper methods for model validation
 *
 *
 */
 
 const JAVA_KEYWORDS = [	"abstract","assert","boolean","break","byte","case",
							"catch","char","class","const","continue","default",
							"double","do","else","enum","extends","false",
							"final","finally","float","for","goto","if",
							"implements","import","instanceof","int","interface","long",
							"native","new","null","package","private","protected",
							"public","return","short","static","strictfp","super",
							"switch","synchronized","this","throw","throws","transient",
							"true","try","void","volatile","while"];
 
 function validIdentifier(candidateName){
	var	syntax = candidateName.match(/^([a-zA-Z_$][a-zA-Z\d_$]*)$/);
	var isKeyword = JAVA_KEYWORDS.indexOf(candidateName.toLowerCase());
	
	return (syntax != null) && (isKeyword == -1);
 }

 function validModelName(candidateName) {
	var	syntax = candidateName.match(/^([a-zA-Z_$][a-zA-Z\d_$]*)$/);
	var packageRegexCheck = candidateName.match('^[a-zA-Z]+(.[a-zA-Z_][a-z0-9_]*)*$');
	var specialCharacterCheck = candidateName.match('^[A-Za-z0-9_.]+$');
	var isKeyword = JAVA_KEYWORDS.indexOf(candidateName.toLowerCase());
	
	return (syntax != null) && (packageRegexCheck != null) && (specialCharacterCheck != null) && (isKeyword == -1);
 }
 
 function circularInherit(model, targetID, visited){
	if(visited.includes(targetID)){
		return true;
	}
	else{
		visited.push(targetID);
		
		let outbound = [];
		model.relations.forEach(rel =>{
			if (rel instanceof ImlInheritance && rel.source == targetID)
				outbound.push(rel);
		})
		if (outbound.length == 0){
			return false;
		}
		else{
			let booleanArray = [];
			outbound.forEach(out =>{
				booleanArray.push(circularInherit(model, out.destination,visited))
			})
			var circle = false;
			booleanArray.forEach(val =>{
				circle = circle | val;
			})
			return circle;
		}
	}
 }
 
function circularReference(model, targetID, visited, relation){
	if(visited.includes(targetID) && visited.length == 1){
		if (relation.lowerBound > 0)
			return true;
	}
	else if(visited.includes(targetID) && visited.length > 1){
		return true;
	}
	else{
		visited.push(targetID);
		
		let outbound = [];
		model.relations.forEach(rel =>{
			if (rel instanceof ImlBoundedRelation && rel.lowerBound > 0 && rel.source == targetID)
				outbound.push(rel);
		})
		if (outbound.length == 0){
			return false;
		}
		else{
			let booleanArray = [];
			outbound.forEach(out =>{
				booleanArray.push(circularReference(model, out.destination,visited,relation))
			})
			var circle = false;
			booleanArray.forEach(val =>{
				circle = circle | val;
			})
			return circle;
		}
	}
 }
 
function circularCompose(targetID, visited, relation){
	
	if(visited.includes(targetID) && visited.length == 1){
		if (relation.lowerBound > 0)
			return true;
	}
	else if(visited.includes(targetID) && visited.length > 1){
		return true;
	}
	else{
		visited.push(targetID);
		
		let outbound = [];
		imlStructuralModel.relations.forEach(rel =>{
			if (rel instanceof ImlComposition && rel.source == targetID && rel.destination != rel.source)
				outbound.push(rel);
		})
		if (outbound.length == 0){
			return false;
		}
		else{
			let booleanArray = [];
			outbound.forEach(out =>{
				booleanArray.push(circularCompose(out.destination,visited, relation))
			})
			var circle = false;
			booleanArray.forEach(val =>{
				circle = circle | val;
			})
			return circle;
		}
	}
 }

//check to see if the inheritence relation is a duplicate of an existing relation
//since we don't allow multiple inheritence, any existing relation with same source means
//it is duplicate an should not be allowed
function duplicateInheritence(sourceClass, relations){
	var found = false;
	if (relations.size == 0){
		return false;
	}
	else{
		relations.forEach(current =>{
			if (current.source == sourceClass.id && current instanceof ImlInheritance)
				found = true;
		});
	}
	return found;
}

//check to see if the added relation is a duplicate of an existing named relation
//(same source and name indicated a duplicate named relation)
function duplicateRelation(name, sourceClass, relations){
	var found = false;
	if (relations.size == 0){
		return false;
	}
	else{
		relations.forEach(current =>{
			if (current.source == sourceClass.id && current.name == name)
				found = true;
		});
	}
	return found;
}

//check to see if the proposed name already exists within a context
//used to check uniqueness of class names in a model, or attribute names in a class
function duplicateName(name, list){
	var found = false;
	if(list.size == 0){
		return false;
	}
	else{
		list.forEach(item => {
            if(name.localeCompare(item.name) == 0) {
                found = true;
            }
        });
	}
	return found;
}

//check to ensure valid CSS color value
function validColour(inputVal) {
	let c = new Option().style;
	c.color = inputVal;
	return c.color == inputVal.toLowerCase();
}

//check to ensure valid font value
function validFont(fontStr) {
        validFonts = ["arial","verdana","helvetica","tahoma","times new roman","georgia","garamond","courier new","brush script mt","trebuchet ms"];
        return validFonts.includes(fontStr.toLowerCase())
}


//check to ensure valid boolean value
function validBool(inputVal){
	return ((inputVal == "TRUE") || (inputVal == "FALSE"));
	
}

//check to ensure value Integer value
function validInt(inputVal){
	if (isNaN(parseInt(inputVal,10))){
		return false;
	}
	if (parseInt(inputVal, 10) <= 0) {
		return false;
	}
	var parsed = parseInt(inputVal,10);
	var parseChangedVal = (inputVal != parsed.toString());
	return !parseChangedVal;
}

//check to ensure valid Double (float) value
function validDouble(inputVal){
	if (isNaN(parseFloat(inputVal,10))){
		return false;
	}
	var parsed = parseFloat(inputVal,10);

	var parseChangedVal = (inputVal != parsed.toString()) && (inputVal.split('.')[1].match(/^(?!0*$).*$/));
	return !parseChangedVal;
}

//check to ensure valid Visibility value
function validVisibility(inputVal){
	return ((inputVal == "PUBLIC") || (inputVal == "PRIVATE") || (inputVal == "PROTECTED"));

}

//check to ensure valid attribute type
function validType(inputVal){
	return ((inputVal == "STRING") ||(inputVal == "BOOLEAN") || (inputVal == "DOUBLE") || (inputVal == "INTEGER"));
}

//check to ensure that the assigned value is valid for the given type
function validAssignment(inputVal, type, name){
	if (type == "STRING"){
		if (name != undefined && name.toLowerCase().includes("color")) {
			if (validColour(inputVal)) {
				return true;
			} else {
				var RegExp = /^#[0-9A-F]{6}$/i;
				return RegExp.test(inputVal);
			}
		} else if (name != undefined && name.toLowerCase().includes("fonttype")) {
			return validFont(inputVal);
		} else {
			return true;
		}
	}
	if (type == "INTEGER"){
		return validInt(inputVal);
	}
	if (type == "BOOLEAN"){
		return validBool(inputVal);
	}
	if (type == "DOUBLE"){
		return validDouble(inputVal);
	}
}

//check to ensure valid lower bound value (a positive integer)
function validLowerBound(inputVal){
	if (!validInt(inputVal)){
		return false;
	}
	return (inputVal >= 0);
}

//check to ensure a valid upper bound (a positive integer or *)
function validUpperBound(inputVal){
	if (inputVal == "*"){
		return true;
	}
	else{
		if (!validInt(inputVal)){
			return false;
		}
		return (inputVal >= 1);
	}	
}

//check to ensure a valid position value (x,y or within list; positive integer value)
function validPosition(inputVal){
	if (!validInt(inputVal)){
		return false;
	}
	return (inputVal >= 0);
}

//check to ensure the entered bounds are valid (lower <= upper, allowing for * upper bound)
function validBounds(lower, upper){
	if (upper == "*"){
		return true;
	}
	else{
		lower = parseInt(lower,10);
		upper = parseInt(upper,10);
		return lower <= upper;
	}
}

//check to ensure valid relation type
function validRelationType(relationType){
	return ((relationType == "REFERENCE") ||(relationType == "INHERITENCE") || (relationType == "COMPOSITION"));
}

//helper function to produce nicely formated error messages
//takes a number and returns the ordinal (e.g. 1 -> 1st, 3 -> 3rd, etc.)
function ordinal_suffix_of(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}

function findMetaClass(meta, curClass){
	var target = null;
	meta.classes.forEach(candidateClass =>{
		if (candidateClass.name.localeCompare(curClass.name)==0)
			target = candidateClass;
	});
	return target;
}


function buildList(meta, metaClass, forward){
	var list = new Map();
	list.set(metaClass.id, metaClass);
	var metaRels = metaClass.relationIds;
	var metaInherit = new Map();
	metaRels.forEach((metaRel,key) =>{
		var rel = meta.relations.get(metaRel);
		if (forward){
			if (rel instanceof ImlInheritance && rel.source.localeCompare(metaClass.id)==0)
				metaInherit.set(key, metaRel);
		}
		else {
			if (rel instanceof ImlInheritance && rel.destination.localeCompare(metaClass.id)==0)
				metaInherit.set(key, metaRel);
		}
	});
	if (metaInherit.size == 0){
		return list;
	} else {
		if (forward)
			var nextInherit = meta.classes.get(meta.relations.get(metaInherit.values().next().value).destination);
		else
			var nextInherit = meta.classes.get(meta.relations.get(metaInherit.values().next().value).source);
		var inheritList = buildList(meta, nextInherit, forward);
		let mergedList = new Map(function*() { yield* list; yield* inheritList; }());
		return mergedList;
	}
}

function contained(list, instance){
	var found = false;
	list.forEach(candidate =>{
		if (candidate.name.localeCompare(instance.name)==0)
			found = true;
	});
	return found;
}

function stringify(list){
	var string = '';
	list.forEach(item =>{
		string += item.name + ', ';
	});
	
	return string.substring(0, string.length - 2);
}

function validInstanceRelation (inst, meta, curRel, match){
			var srcMeta = meta.classes.get(match.source);
			var dstMeta = meta.classes.get(match.destination);
			
			
			
			var srcInst = buildList(meta, findMetaClass(meta, inst.classes.get(curRel.source)),true);
			var dstInst = buildList(meta, findMetaClass(meta, inst.classes.get(curRel.destination)),true);
			
			var validSrc = contained(srcInst, srcMeta);
			var validDst = contained(dstInst, dstMeta);
			
			
			
			if (!(validSrc && validDst)){
				var srcString = stringify(buildList(meta, meta.classes.get(match.source),false));
				var dstString = stringify(buildList(meta, meta.classes.get(match.destination),false));
				return '<li>An invalid "' + curRel.name + '" relation exists; valid sources include (' + srcString + ') and valid targets include (' + dstString + ').</li>';
			}
			else
				return '';
}

function checkConformance(inst, meta){
	var reportString = '';
	
	var instanceClasses = inst.classes;
	var metaClasses = meta.classes;

	instanceClasses.forEach(curClass =>{
		var attrs = curClass.attributes;
		var containedAttr = [];
		if (attrs.length != 0) {
			attrs.forEach(curAttr => {
				containedAttr.push(curAttr.name);
			});
		}
		console.log(curClass.name + ': ' + containedAttr.length);
		switch (curClass.name) {
			case "winByRounds":
                        case "winByScore":
                        case "QuestionsDeck":
			case "AnswersDeck":
			case "GeneralDeck":
				if (containedAttr.length != 1)
					reportString += '<li>Class "' + curClass.name + '" is missing attributes, undo deleting them to remove this error.</li>';
                                break;
			case "CommunityJudgeGame":
				if (containedAttr.length != 5)
					reportString += '<li>Class "' + curClass.name + '" is missing attributes, undo deleting them to remove this error.</li>';
				break;
			case "RelationsGame":
				if (containedAttr.length != 6)
					reportString += '<li>Class "' + curClass.name + '" is missing attributes, undo deleting them to remove this error.</li>';
				break;
			default: // if the class name is a theme
				if (containedAttr.length != 7) 
					reportString += '<li>Class "' + curClass.name + '" is missing attributes, undo deleting them to remove this error.</li>';
		}
	});

	var games = 0;
	instanceClasses.forEach(curClass =>{
    		if (curClass.name == "CommunityJudgeGame" || curClass.name == "RelationsGame")
    	    		games++;
	});
	if (games == 0) {
		reportString += "<li>You must add at least one game object.</li>";
	} else if (games > 1) {
		reportString += "<li>There are too many top-level game objects; only one game object is allowed.</li>";
	}

	var fileName = "";
	instanceClasses.forEach(curClass =>{
		if (curClass.attributes.size != 0) {
		if (curClass.name == "QuestionsDeck" || curClass.name == "AnswersDeck") {
			if (fileName == "") {
				fileName = curClass.attributes.entries().next().value[1].value;
			} else {
				if (fileName == curClass.attributes.entries().next().value[1].value) {
					reportString += '<li>QuestionsDeck and AnswersDeck fileNames cannot be the same.</li>';
				}
			}
		}
		}
	});
	
	instanceClasses.forEach(curClass =>{
		var attrs = curClass.attributes;
		var maxPlayers = 0;
		if (attrs.size != 0) {
		attrs.forEach(curAttr =>{
			if (curAttr.lowerBound > 0 && curAttr.value == "")
				reportString += '<li>Class "' + curClass.name + '" Required Attribute "' + curAttr.name + '" is missing a value and must be instantiated.</li>';

			if (curAttr.name == "maxNumOfPlayers") {
				maxPlayers = parseInt(curAttr.value);
			}
			if (curAttr.name == "minNumOfPlayers") {
				if (maxPlayers < parseInt(curAttr.value)) {
					reportString += '<li>In Class "' + curClass.name + '", the maximum number of players must be greater or equal to the minimum number of players.</li>';
				}
			}
		});
		}
	});
	
	
	var instanceRelations = inst.relations;
	instanceRelations.forEach(curRel =>{
		var metaRelations = meta.relations;
		var match = null;
		metaRelations.forEach(metaRel =>{
			var srcClassInst = instanceClasses.get(curRel.source).name;
			var dstClassInst = instanceClasses.get(curRel.destination).name;
			var srcClassMeta = metaClasses.get(metaRel.source).name;
			var dstClassMeta = metaClasses.get(metaRel.destination).name;
			if (!(metaRel instanceof ImlInheritance) && metaRel.name.localeCompare(curRel.name)==0){
				match = metaRel;
			}
			
		});
		if (match){
			reportString += validInstanceRelation(inst, meta, curRel, match)	
		}
	});
	
	
	instanceClasses.forEach(curClass =>{
		var metaClasses = meta.classes;
		var match = null;
		metaClasses.forEach(metaClass =>{
			if (metaClass.name.localeCompare(curClass.name)==0){
				match = metaClass;
			}
		});
		var metaRelationsTmp = match.relationIds;
		var classChainTmp = [];
		classChainTmp.push(curClass.name);
		const [metaRelations,classChain] = inheritRelations(meta, metaRelationsTmp, curClass, classChainTmp);
		metaRelations.forEach(metaRelID =>{
			var metaRel = meta.relations.get(metaRelID);
			if (!(metaRel instanceof ImlInheritance)){
				var metaRelName = metaRel.name;
				var metaRelLB = metaRel.lowerBound;
				var metaRelUB = metaRel.upperBound;
				var srcClass = meta.classes.get(metaRel.source);
				if(classChain.includes(srcClass.name)){
					var count = 0;
					var instanceRelations = curClass.relationIds;
					instanceRelations.forEach(curRelID =>{
						var curRel = inst.relations.get(curRelID);
						var curRelSrc = instanceClasses.get(curRel.source);
						if (curRel.name.localeCompare(metaRelName)==0){
							count++;
						}
					});
					if (count < metaRelLB){
						reportString += '<li>A "' + curClass.name + '" Class exists with too few outbound "' + metaRelName + '" relations; this instance contains ' + count + ' but requires at least ' + metaRelLB + '</li>';
					}
					else if (metaRelUB != '*' && count > metaRelUB){
						reportString += '<li>A "' + curClass.name + '" Class exists with too many outbound "' + metaRelName + '" relations; this instance contains ' + count + ' but requires a maximum of ' + metaRelUB + '</li>';
					}
					
				}
			}
		})
	});
	
	return reportString;
}

function inheritRelations(metamodel, list, imlClass, classChain){
	var outboundInherit = null;
	metamodel.relations.forEach(rel => {
		if (rel instanceof ImlInheritance){
			var src = metamodel.classes.get(rel.source);
			if (src.name.localeCompare(imlClass.name)==0){
				outboundInherit = metamodel.classes.get(rel.destination);
			}
		}
	});
	if (outboundInherit == null)
		return [list,classChain];
	else{
		var inheritList = outboundInherit.relationIds;
		let mergedList = new Map(function*() { yield* list; yield* inheritList; }());
		classChain.push(outboundInherit.name);
		return inheritRelations(metamodel, mergedList, outboundInherit,classChain);
	}
}
