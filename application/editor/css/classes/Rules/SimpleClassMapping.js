class SimpleClassMapping extends ClassMapping {
    targetClass; attributeMappings; attributeAssignments;

    constructor(sourceClass, targetClass, attributeAssignments) {
        super(sourceClass);
        if(targetClass instanceof ImlClass || 'none') {
            this.targetClass = targetClass;
        } else {
            throw new Error("The targetClass variable of a Class Mapping must be of type ImlClass.");
        }

        this.attributeMappings = [];
        this.attributeAssignments = attributeAssignments;
    }

    /**
     * Accepts a new attribute mapping for a simple class mapping.
     * Need to pass an attribute mapping object because context decides if its
     * a complex or simple attribute mapping.
     * 
     * @param {AttributeMapping} attributeMapping 
     */
    addAttributeMapping(attributeMapping) {
        if(attributeMapping instanceof AttributeMapping) {
            this.attributeMappings.push(attributeMapping);
        } else {
            throw new Error("attributeMapping must be of type, AttributeMapping");
        }
    }

    toString() {
        return super.toString(this.targetClass);
    }
}