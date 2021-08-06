class ImlRelation {
    destination; source; name; id;

    constructor(destination, source, id) {
        this.destination = destination;
        this.source = source;
        this.id = id;
    }

    updatePropertyByString(propertyName, propertyValue) {
        propertyName = propertyName.toLowerCase();
        if(propertyName.localeCompare("destination") == 0) {
            this.destination = propertyValue;
        } else if(propertyName.localeCompare("source") == 0) {
            this.source = propertyValue;
        }
    }

    ///////////////////////////// Setters /////////////////////////////////

    /**
     * @param {string} ImlClassId
     */
    set destination(ImlClassId) {
        this.destination = ImlClassId;
    }

    /**
     * @param {string} ImlClassId
     */
    set source(ImlClassId) {
        this.source = ImlClassId;
    }

    /**
     * @param {string} name
     */
    set name(name) {
        this.name = name;
    }

    /**
     * @param {string} id
     */
    set id(id) {
        this.id = id;
    }

    ///////////////////////////// Getters /////////////////////////////////

    get destination() {
        return this.destination;
    }
    
    get source() {
        return this.source;
    }

    get name() {
        return this.name;
    }
    
    get id() {
        return this.id;
    }
}