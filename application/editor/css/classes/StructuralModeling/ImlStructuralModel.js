class ImlStructuralModel {
    classes; relations;
	name; fileName;
	conformsTo

    constructor() {
        this.classes = new Map();
        this.relations = new Map();
		this.name = "IML_Structural_Model";
		this.fileName = "IML_Structrual_Model.iml";
		this.conformsTo = "IML Definition";
    }

    /**
     * 
     * @param {ImlClass} imlClass 
     */
    addClass(imlClass) {
        this.classes.set(imlClass.id, imlClass);
    }

    /**
     * 
     * @param {ImlRelation} imlRelation 
     */
    addRelation(imlRelation) {
        this.relations.set(imlRelation.id, imlRelation);
        
        this.classes.get(imlRelation.source).addRelationId(imlRelation.id);
        this.classes.get(imlRelation.destination).addRelationId(imlRelation.id);
    }

    /**
     * 
     * @param {String} imlAttributeId 
     */
    getAttribute(imlAttributeId) {
        var imlAttribute = undefined;
        // Grab each class.
        this.classes.forEach(imlClass => {
            // Grab each attribute.
            imlClass.attributes.forEach(attribute => {
                // Check if this is the desired attribute
                if(attribute.id == imlAttributeId) {
                    imlAttribute = attribute; // Set desired attribute.
                }
            })
        });

        // Return desired attribute. If not found, return undefined.
        return imlAttribute; 
    }

    /**
     * Return an element found in the IML structural model by passing the element UUID.
     * Could return ImlClass, ImlAttribute or ImlRelation. Will return undefined if nothing found.
     * 
     * @param {String} elementId 
     */
    getElement(elementId) {
        var imlClass = this.classes.get(elementId);
        if(imlClass) {
            return imlClass;
        }

        var imlAttribute = this.getAttribute(elementId);
        if(imlAttribute) {
            return imlAttribute;
        }

        var imlRelation = this.relations.get(elementId);
        if(imlRelation) {
            return imlRelation;
        }

        return undefined;
    }
	
	setName(name){
		this.name = name;
	}
	
	setFileName(fileName){
		this.fileName = fileName;
	}

	setConformsTo(conformsTo){
		this.conformsTo = conformsTo;
	}

    ///////////////////////////// Getters /////////////////////////////////

    get classes() {
        return this.classes;
    }

    get relations() {
        return this.relations;
    }
	
	get name() {
		return this.name;
	}
	
	get fileName() {
		return this.fileName;
	}
	
	get conformsTo() {
		return this.conformsTo;
	}
}