class AttributeMapping {
    sourceAttribute;

    constructor(sourceAttribute) {
        if(sourceAttribute instanceof ImlAttribute || sourceAttribute instanceof ImlBoundedRelation) {
            this.sourceAttribute = sourceAttribute;
        } else {
            throw new Error("The sourceAttribute variable of an Attribute Mapping must be of type ImlAttribute.");
        }
    }
}