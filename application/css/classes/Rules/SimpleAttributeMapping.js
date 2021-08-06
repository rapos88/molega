class SimpleAttributeMapping extends AttributeMapping {
    targetAttribute; attributeAssignment;

    constructor(sourceAttribute, targetAttribute, attributeAssignment) {
        // Error handling happens in the parent.
        super(sourceAttribute);

        if(targetAttribute instanceof ImlAttribute || targetAttribute instanceof ImlBoundedRelation || targetAttribute == 'none') {
            this.targetAttribute = targetAttribute;
        } else {
            throw new Error("The targetAttribute variable of an Attribute Mapping must be of type ImlAttribute or ImlBoundedRelation.");
        }

        this.attributeAssignment = attributeAssignment;
    }
}