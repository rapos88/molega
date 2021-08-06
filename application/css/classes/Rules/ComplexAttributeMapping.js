class ComplexAttributeMapping extends AttributeMapping {
    conditions;

    constructor(sourceAttribute) {
        super(sourceAttribute);
        this.conditions = []; // Not required because of expected implementation pattern.
    }

    /**
     * Accepts a new attribute conditions for a complex attribute mapping.
     * 
     * @param {AttributeCondition} attributeCondition 
     */
    addCondition(attributeCondition) {
        if(attributeCondition instanceof AttributeCondition) {
            this.conditions.push(attributeCondition);
        } else {
            throw new Error("attributeCondition must be of type, AttributeCondition");
        }
    }
}