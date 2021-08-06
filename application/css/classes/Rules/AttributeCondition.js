class AttributeCondition {
    condition; targetAttribute; attributeAssignment;

    constructor(condition, targetAttribute, attributeAssignment) {
        if(condition instanceof Condition || condition == 'none') {
            this.condition = condition;
        } else {
            throw new Error("The condition variable of an Attribute Condition must be of type Condition.");
        }
        
        if(targetAttribute instanceof ImlAttribute || targetAttribute instanceof ImlBoundedRelation || targetAttribute == 'none') {
            this.targetAttribute = targetAttribute;
        } else {
            throw new Error("The targetAttribute variable of an Attribute Condition must be of type ImlAttribute.");
        }

        this.attributeAssignment = attributeAssignment;
    }
}