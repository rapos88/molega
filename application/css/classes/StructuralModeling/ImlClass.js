class ImlClass {
    name; attributes; relationIds; isAbstract; id;

    constructor(name, attributes, relationIds, isAbstract, id) {
        this.name = name;
        this.attributes = attributes;
        this.relationIds = relationIds;
        this.isAbstract = isAbstract;
        this.id = id;
    }

    addAttribute(attr) {
        this.attributes.set(attr.id, attr);
    }

    addRelationId(relationId) {
        this.relationIds.set(relationId, relationId);
    }

    deleteAttribute(attr) {
        this.attributes.delete(attr.id);
    }

    deleteRelationId(relationId) {
        this.relationIds.delete(relationId);
    }

    getAttributeByName(attributeName) {
        var rtnAttribute = undefined;
        this.attributes.forEach(attribute => {
            if(attribute.name == attributeName) {
                rtnAttribute = attribute;
                return; // Escapes forEach
            }
        });
        
        return rtnAttribute;
    }

    printAttributes(){
        var rtnStr = "";
        $.each(this.attributes, function(index, attr) {
            rtnStr += attr.print();
        });
        return rtnStr;
    }
    
    updatePropertyByString(propertyName, propertyValue) {
        propertyName = propertyName.toLowerCase();
        if(propertyName.localeCompare("name") == 0) {
            return this.name = propertyValue;
        } else {
            return this.isAbstract = propertyValue.toLowerCase();
        }
    }

    ///////////////////////////// Setters /////////////////////////////////

    /**
     * @param {Map<string, Attribute>} attributes
     */
    set attributes(attributes) {
        this.attributes = attributes;
    }
    /**
     * @param {string} id
     */
    set id(id) {
        this.id = id;
    }
    /**
     * @param {boolean} isAbstract
     */
    set isAbstract(isAbstract) {
        this.isAbstract = isAbstract;
    }
    /**
     * @param {string} name
     */
    set name(name) {
        this.name = name;
    }
    /**
     * @param {Array<string>} relationIds
     */
    set relationIds(relationIds) {
        this.relationIds = relationIds;
    }

    ///////////////////////////// Getters /////////////////////////////////

    get attributes() {
        return this.attributes;
    }

    get id() {
        return this.id;
    }

    get isAbstract() {
        return this.isAbstract;
    }

    get name() {
        return this.name;
    }

    get relationIds() {
        return this.relationIds;
    }
}

