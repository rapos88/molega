class RelationMapping {
    sourceClass; targetClass; attributeMapping;

    constructor(sourceClass, targetClass, attributeMapping) {
        this.sourceClass = sourceClass;
        this.targetClass = targetClass;
        this.attributeMapping = attributeMapping
    }
}