class ImlAction {
	actionType;
	actionTarget;
	actionTargetType;
	previousValue;
	newValue;
	
	constructor(actionType, actionTarget, actionTargetType, previousValue, newValue){
		this.actionType = actionType;
		this.actionTarget = actionTarget;
		this.actionTargetType = actionTargetType;
		this.previousValue = previousValue;
		this.newValue = newValue;
	}
	
	///////////////////////////// Setters /////////////////////////////////

    /**
     * @param {ImlActionType} actionType
     */
    set actionType(actionType) {
        this.actionType = actionType;
    }
	
    /**
     * @param {Object} actionTarget
     */
    set actionTarget(actionTarget) {
        this.actionTarget = actionTarget;
    }

    /**
     * @param {ImlActionTargetType} actionTargetType
     */
    set actionTargetType(actionTargetType) {
        this.actionTargetType = actionTargetType;
    }
    
	/**
     * @param {String} previousValue
     */
    set previousValue(previousValue) {
        this.previousValue = previousValue;
    }
    
	/**
     * @param {String} newValue
     */
    set newValue(newValue) {
        this.newValue = newValue;
    }

    ///////////////////////////// Getters /////////////////////////////////

    get actionType() {
        return this.actionType;
    }

    get actionTarget() {
        return this.actionTarget;
    }
    
    get actionTargetType() {
        return this.actionTargetType;
    }
    
    get previousValue() {
        return this.previousValue;
    }

    get newValue() {
        return this.newValue;
    }

}