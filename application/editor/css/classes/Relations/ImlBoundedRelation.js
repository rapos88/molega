class ImlBoundedRelation extends ImlRelation {
    lowerBound; upperBound;

    constructor(destination, source, name, lowerBound, upperBound, id) {
        super(destination, source, id);
        this.name = name;
        this.lowerBound = lowerBound;
        this.upperBound = upperBound;
    }

    updatePropertyByString(propertyName, propertyValue) {
        propertyName = propertyName.toLowerCase();
        if(propertyName.localeCompare("destination") == 0) {
            this.destination = propertyValue;
        } else if(propertyName.localeCompare("source") == 0) {
            this.source = propertyValue;
        } else if(propertyName.localeCompare("name") == 0) {
            this.name = propertyValue;
        } else if(propertyName.localeCompare("lowerbound") == 0) {
            this.lowerBound = propertyValue;
        } else if(propertyName.localeCompare("upperbound") == 0) {
            // if(propertyValue.localeCompare("*") == 0) {
            //     this.upperBound = Number.MAX_SAFE_INTEGER;
            // } else {
                this.upperBound = propertyValue;   
            // }
        }
    }
    
    ///////////////////////////// Setters /////////////////////////////////

    /**
     * @param {number} lowerBound
     */
    set lowerBound(lowerBound) {
        this.lowerBound = lowerBound;
    }

    /**
     * @param {number} upperBound
     */
    set source(upperBound) {
        this.upperBound = upperBound;
    }

    ///////////////////////////// Getters /////////////////////////////////

    get lowerBound() {
        return this.lowerBound;
    }
    
    get upperBound() {
        return this.upperBound;
    }
}