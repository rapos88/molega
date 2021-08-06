
function getAttributeByName(imlClass, attributeName) {
	rtnAttribute = undefined;
	imlClass.attributes.forEach(attribute => {
		if(attribute.name == attributeName) {
			rtnAttribute = attribute;
			return;
		}
	});

	if(rtnAttribute) {
		return rtnAttribute;
	}
	return new Error('The ' + attributeName + ' attribute was not found in ' + imlClass.name);
}

function getChildClassNames(imlClass, imlStructuralModel) {
	var classNames = [];

	if(!imlClass) {
		return classNames;
	}

	imlClass.relationIds.forEach(relationId => {
		relation = imlStructuralModel.getElement(relationId);
		if(relation instanceof ImlInheritance && relation.destination == imlClass.id) {
			childClass = imlStructuralModel.getElement(relation.source);
			classNames.push(childClass.name);

			// Get children of children and merge the return with classNames
			var childClassChildNames = getChildClassNames(childClass, imlStructuralModel);
			classNames = classNames.concat(childClassChildNames);
		}
	});

	return classNames;
}

function getInheritedAttributes(imlClass, targetMetaModel){
	var inheritedAttrs = new Map();
	var inheritanceRels = new Map();
	
	//get outgoing relations
	var rels = targetMetaModel.relations;
	rels.forEach(rel => {
		if(rel.source.localeCompare(imlClass.id)==0 && rel instanceof ImlInheritance){
			inheritanceRels.set(0,rel);
		}
	});

	//Recursive Base Case: no inheritance, return only these attributes
	if(inheritanceRels.size < 1) {
		return imlClass.attributes;
	}
	else{ // if there is further inheritance, get the attributes from the inherited class, merge with current, and return
		var rel = inheritanceRels.get(0);
		var inheritedClassID = rel.destination;
		var inheritedClass = targetMetaModel.classes.get(inheritedClassID);
		var recursiveAttrs = getInheritedAttributes(inheritedClass, targetMetaModel);
		inheritedAttrs = new Map(imlClass.attributes);
		var pos = 1;
		var finalAttrs = mergeAttributeMapsWithOverload(recursiveAttrs,inheritedAttrs);
		finalAttrs.forEach (attr => {
			attr.position = pos++;
		});
		return finalAttrs;
	}
}

function getInheritedRelationAttributes(imlClass, targetMetaModel) {
	var inheritedAttrRels = new Map();
	var inheritanceRels = new Map();

	// Get outgoing relations.
	var rels = targetMetaModel.relations;
	rels.forEach(rel => {
		if(rel.source.localeCompare(imlClass.id)==0 && rel instanceof ImlInheritance){
			inheritanceRels.set(0,rel);
		}
	});

	// Recursive Base Case: no inheritance, return only these relation attributes.
	if(inheritanceRels.size < 1) {
		return getRelationAttributesOfLocalClass(imlClass, targetMetaModel);
	}
	else{ // if there is further inheritance, get the attributes from the inherited class, merge with current, and return
		var rel = inheritanceRels.get(0);
		var inheritedClassID = rel.destination;
		var inheritedClass = targetMetaModel.classes.get(inheritedClassID);
		var recursiveAttrs = getInheritedRelationAttributes(inheritedClass, targetMetaModel);
		inheritedAttrRels = getRelationAttributesOfLocalClass(imlClass, targetMetaModel);
		var finalAttrs = mergeAttributeMapsWithOverload(recursiveAttrs, inheritedAttrRels);
		return finalAttrs;
	}
}

function getParentClassNames(imlClass, imlStructuralModel) {
	var classNames = [];

	if(!imlClass) {
		return classNames;
	}

	imlClass.relationIds.forEach(relationId => {
		relation = imlStructuralModel.getElement(relationId);
		if(relation instanceof ImlInheritance && relation.source == imlClass.id) {
			parentClass = imlStructuralModel.getElement(relation.destination);
			classNames.push(parentClass.name);

			// Get grandparents and merge the return with classNames
			var parentClassParentNames = getParentClassNames(parentClass, imlStructuralModel);
			classNames = classNames.concat(parentClassParentNames);
		}
	});

	return classNames;
}

function getRelationAttributesOfLocalClass(imlClass, targetMetaModel) {
	attrRelations = new Map();

	imlClass.relationIds.forEach(relationId => {
		var relation = targetMetaModel.relations.get(relationId);
		// If the relation's source is imlClass and its a Composition or Reference relation,
		// Then, the relation is an attribute of imlClass. 
		if(relation.source == imlClass.id && relation instanceof ImlBoundedRelation) {
			attrRelations.set(relation.id, relation);
		}
	});

	return attrRelations;
}

function mergeAttributeMapsWithOverload(existingList, newList){
	
	newList.forEach(curAttr => {
		existingList.forEach((value,key,map) => {
			if (value.name.localeCompare(curAttr.name)==0) {
				existingList.delete(key);
			}
		});
	});
	
	return new Map(function*() { yield* existingList; yield* newList; }());
}