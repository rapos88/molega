class Condition {
    attribute; operator; conditionalValue;

    constructor(attribute, operator, conditionalValue) {
        this.attribute = attribute;
        this.operator = operator;
        this.conditionalValue = conditionalValue;
    }

    toString() {
        return 'if (' + this.attribute.name + ' ' + this.operator + ' ' + this.conditionalValue + ')';
    }
}