class ClassCondition {
    condition; targetClass; attributeMappings; attributeAssignments;

    constructor(condition, targetClass, attributeAssignments) {
        if(condition instanceof Condition || condition == 'none') {
            this.condition = condition;
        } else {
            throw new Error("The condition variable of an Class Condition must be of type Condition.");
        }
        if(targetClass instanceof ImlClass || targetClass == 'none') {
            this.targetClass = targetClass;
        } else {
            throw new Error("The targetClass variable of a Class Condition must be of type ImlClass.");
        }

        this.attributeMappings = [];
        this.attributeAssignments = attributeAssignments;
    }

    addAttributeMapping(attributeMapping) {
        if(attributeMapping instanceof AttributeMapping) {
            this.attributeMappings.push(attributeMapping);
        } else {
            throw new Error("attributeMapping must be of type, AttributeMapping");
        }
    }
}