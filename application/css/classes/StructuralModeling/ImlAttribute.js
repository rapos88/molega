class ImlAttribute {
    visibility; name; type; value; lowerBound; upperBound; position; id;

    constructor(visibility, name, type, value, position, id, lb=0, ub=1) {
        this.visibility = visibility;
        this.name = name;
        this.type = type;
        this.value = value;
        this.lowerBound = lb;
        this.upperBound = ub;
        this.position = position;
        this.id = id;
    }

    print() {
        var visibilitySymbol;
        if(this.visibility.localeCompare(ImlVisibilityType.PUBLIC) == 0) {
            visibilitySymbol = "+";
        } else if (this.visibility.localeCompare(ImlVisibilityType.PRIVATE) == 0) {
            visibilitySymbol = "-";
        } else { // ImlVisibilityType = PROTECTED
            visibilitySymbol = "#";
        }
		
		
		var valString="";

		if(!(Array.isArray(this.value))){
			if(this.value == undefined || this.value == "") {
				return visibilitySymbol + " " + this.name + " : " + this.type;
			}
			if(this.type == ImlType.STRING){
				valString = '"' + this.value + '"';
			}
			else{
				valString = this.value;
			}
		}
		else{
			if (this.value.length <= 5){
				valString = "[";
				for (var index = 0; index < this.value.length; index++) { 
					if(this.type == ImlType.STRING){valString +='"';}
					valString += this.value[index];
					if(this.type == ImlType.STRING){valString +='"';}
					if(index != this.value.length -1){valString += ",";}
				} 
				valString += "]";
			}
			else {
				valString += this.type + "[" + this.value.length + "]";
			}
		}
		
		return visibilitySymbol + " " + this.name + " : " + this.type + " = " + valString;
        
    }

    updatePropertyByString(propertyName, propertyValue) {
        propertyName = propertyName.toLowerCase();
        if(propertyName.localeCompare("visibility") == 0) {
            this.visibility = propertyValue;
        } else if(propertyName.localeCompare("name") == 0) {
            this.name = propertyValue;
        } else if(propertyName.localeCompare("type") == 0) {
            this.type = propertyValue;
        } else if(propertyName.localeCompare("value") == 0) {
            this.value = propertyValue;
        } else if(propertyName.localeCompare("lowerbound") == 0) {
            this.lowerBound = propertyValue;
        } else if(propertyName.localeCompare("upperbound") == 0) {
            this.upperBound = propertyValue;
        }
    }

    ///////////////////////////// Setters /////////////////////////////////

    /**
     * @param {ImlVisibilityType} visibility
     */
    set visibility(visibility) {
        this.visibility = visibility;
    }

    /**
     * @param {string} name
     */
    set name(name) {
        this.name = name;
    }

    /**
     * @param {ImlType} type
     */
    set type(type) {
        this.type = type;
    }

    /**
     * @param {string} value
     */
    set value(value) {
        this.value = value;
    }
    
    /**
     * @param {number} lowerBound
     */
    set value(lowerBound) {
        this.lowerBound = lowerBound;
    }
    
    /**
     * @param {number} upperBound
     */
    set value(upperBound) {
        this.upperBound = upperBound;
    }

    /**
     * @param {string} id
     */
    set value(id) {
        this.id = id;
    }

    ///////////////////////////// Getters /////////////////////////////////

    get visibility() {
        return this.visibility;
    }

    get name() {
        return this.name;
    }
    
    get type() {
        return this.type;
    }
    
    get value() {
        return this.value;
    }

    get lowerBound() {
        return this.lowerBound;
    }
    
    get upperBound() {
        return this.upperBound;
    }

    get id() {
        return this.id;
    }

}
