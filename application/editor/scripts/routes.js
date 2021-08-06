function simpleRoute(graph){
	graph.getLinks().forEach(link => {
		link.set('router', { name: 'normal' });
	});
	ImlInheritanceElement = joint.dia.Link.define('iml.Inheritance', {
		router: { name: 'normal' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-target" fill="white" stroke="black" d="M 15 -7.5 0 0 15 7.5 15 -7.5"/>', // Change "d" to adjust the arrow-head
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	ImlCompositionElement = joint.dia.Link.define('iml.Composition', {
		router: { name: 'normal' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 15 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 12.5 -7 0 0 12.5 7 25 0 12.5 -7"/>', // Change "d" to adjust the arrow-head
			'<path class="marker-target" fill="none" stroke="black" d="M 15 -7.5 0 0 15 7.5"/>',
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	ImlReferenceElement = joint.dia.Link.define('iml.Reference', {
		router: { name: 'normal' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>', // Change "d" to adjust the arrow-head
			'<path class="marker-target" fill="none" stroke="black" d="M 15 -7.5 0 0 15 7.5"/>',
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	redrawRelations();
	resetHighlights();
	routingMode = 'simpleRoute';
}

function orthogonalRoute(){
	undoStack.push(new ImlAction(ImlActionType.MENU_CHANGE, imlStructuralModel, ImlActionTargetType.ROUTING, routingMode, "orthogonalRoute"));
	graph.getLinks().forEach(link => {
		link.set('router', { name: 'orthogonal' });
	});
	ImlInheritanceElement = joint.dia.Link.define('iml.Inheritance', {
		router: { name: 'orthogonal' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-target" fill="white" stroke="black" d="M 15 -7.5 0 0 15 7.5 15 -7.5"/>', // Change "d" to adjust the arrow-head
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	ImlCompositionElement = joint.dia.Link.define('iml.Composition', {
		router: { name: 'orthogonal' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 15 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 12.5 -7 0 0 12.5 7 25 0 12.5 -7"/>', // Change "d" to adjust the arrow-head
			'<path class="marker-target" fill="none" stroke="black" d="M 15 -7.5 0 0 15 7.5"/>',
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	ImlReferenceElement = joint.dia.Link.define('iml.Reference', {
		router: { name: 'orthogonal' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>', // Change "d" to adjust the arrow-head
			'<path class="marker-target" fill="none" stroke="black" d="M 15 -7.5 0 0 15 7.5"/>',
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	redrawRelations();
	resetHighlights();
	routingMode = 'orthogonalRoute';
}

function manhattanRoute(){
	undoStack.push(new ImlAction(ImlActionType.MENU_CHANGE, imlStructuralModel, ImlActionTargetType.ROUTING, routingMode, "manhattanRoute"));
	graph.getLinks().forEach(link => {
		link.set('router', { name: 'manhattan' });
	});
	ImlInheritanceElement = joint.dia.Link.define('iml.Inheritance', {
		router: { name: 'manhattan' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-target" fill="white" stroke="black" d="M 15 -7.5 0 0 15 7.5 15 -7.5"/>', // Change "d" to adjust the arrow-head
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	ImlCompositionElement = joint.dia.Link.define('iml.Composition', {
		router: { name: 'manhattan' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 15 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 12.5 -7 0 0 12.5 7 25 0 12.5 -7"/>', // Change "d" to adjust the arrow-head
			'<path class="marker-target" fill="none" stroke="black" d="M 15 -7.5 0 0 15 7.5"/>',
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	ImlReferenceElement = joint.dia.Link.define('iml.Reference', {
		router: { name: 'manhattan' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>', // Change "d" to adjust the arrow-head
			'<path class="marker-target" fill="none" stroke="black" d="M 15 -7.5 0 0 15 7.5"/>',
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	redrawRelations();
	resetHighlights();
	routingMode = 'manhattanRoute';
}

function metroRoute(){
	undoStack.push(new ImlAction(ImlActionType.MENU_CHANGE, imlStructuralModel, ImlActionTargetType.ROUTING, routingMode, "metroRoute"));
	graph.getLinks().forEach(link => {
		link.set('router', { name: 'metro' });
	});
	ImlInheritanceElement = joint.dia.Link.define('iml.Inheritance', {
		router: { name: 'metro' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-target" fill="white" stroke="black" d="M 15 -7.5 0 0 15 7.5 15 -7.5"/>', // Change "d" to adjust the arrow-head
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	ImlCompositionElement = joint.dia.Link.define('iml.Composition', {
		router: { name: 'metro' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 15 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 12.5 -7 0 0 12.5 7 25 0 12.5 -7"/>', // Change "d" to adjust the arrow-head
			'<path class="marker-target" fill="none" stroke="black" d="M 15 -7.5 0 0 15 7.5"/>',
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	ImlReferenceElement = joint.dia.Link.define('iml.Reference', {
		router: { name: 'metro' },
		markup: [
			'<path class="connection" stroke="black" d="M 0 0 0 0"/>',
			'<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>', // Change "d" to adjust the arrow-head
			'<path class="marker-target" fill="none" stroke="black" d="M 15 -7.5 0 0 15 7.5"/>',
			'<path class="connection-wrap" d="M 0 0 0 0"/>',
			'<g class="labels"/>',
			'<g class="marker-vertices"/>',
			'<g class="marker-arrowheads"/>',
			'<g class="link-tools"/>'
		].join('')
	});
	redrawRelations();
	resetHighlights();
	routingMode = 'metroRoute';
}

