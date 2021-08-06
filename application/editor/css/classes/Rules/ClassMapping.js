class ClassMapping {
    sourceClass;

    constructor(sourceClass) {
        if(sourceClass instanceof ImlClass) {
            this.sourceClass = sourceClass;
        } else {
            throw new Error("The sourceClass variable of a Class Mapping must be of type ImlClass.");
        }
    }

    toString(targetClass) {
        if(targetClass == 'none') {
            return this.sourceClass.name + ' maps to none';
        }
        return this.sourceClass.name + ' maps to ' + targetClass.name;
    }
}