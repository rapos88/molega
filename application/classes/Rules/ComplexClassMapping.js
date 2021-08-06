class ComplexClassMapping extends ClassMapping {
    conditions;

    constructor(sourceClass) {
        super(sourceClass);
        this.conditions = [];
    }

    addClassCondition(classCondition) {
        if(classCondition instanceof ClassCondition) {
            this.conditions.push(classCondition);
        } else {
            throw new Error("classCondition must be of type, ClassCondition");
        }
    }

    /**
     * Adds an attribute mapping to a ClassCondition in this ComplexClassMapping.
     * The ClassCondition is found by the target class id.
     * 
     * @param {String} targetClassId id of a ClassCondition's targetClass.
     * @param {AttributeMapping} attributeMapping AttributeMapping to add to ClassCondition.
     */
    addClassConditionAttributeMappingById(targetClassId, attributeMapping) {
        this.conditions.forEach(classCondition => {
            if(classCondition.targetClass.id == targetClassId) {
                classCondition.addAttributeMapping(attributeMapping);
            }
        })
    }
    
    toString() {
        var rtnStr = this.sourceClass.name + " maps to ";

        var targetClassNames = new Set();
        // Gather target class from each condition
        this.conditions.forEach(classCondition => {
            var targetClassName = classCondition.targetClass.name;
            // If targetClassName is undefined, then dealing with 'none' target.
            if(!targetClassName) {
                targetClassName = 'none';
            }
            targetClassNames.add(targetClassName);
        });

        targetClassNames.forEach(className => {
            rtnStr += className + ", ";
        });

        // Remove trailing comma and return.
        return rtnStr.substring(0, rtnStr.length - 2);
    }
}