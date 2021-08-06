var ImlClassElement = joint.dia.Element.define('iml.Class', {
    attrs: {
        classAttributeRect: {
            height: 25,
            width: 100,
            strokeWidth: 2,
            stroke: '#000000',
            fill: 'rgba(204,229,255,1.0)'
        },
        classNameLabel: {
            ref: 'classAttributeRect',
            textVerticalAnchor: 'middle',
            textAnchor: 'middle',
            refX: '50%',        // This needs to be relative for centering
            refY: 12.5,     // The text should remain at the top of the class therefore this is constant
            fontSize: 16,
        },
    }
}, {    
    markup: [{
        tagName: 'rect',
        selector: 'classAttributeRect'
    }, {
        tagName: 'text',
        selector: 'classNameLabel'
    }]
});

var drawPoint = joint.dia.Element.define('iml.Point', {
    attrs: {
        classAttributeRect: {
            height: 0,
            width: 0,
            strokeWidth: 0,
        },
    }
}, {    
    markup: [{
        tagName: 'rect',
        selector: 'classAttributeRect'
    }]
});

var ImlAttributeElement = joint.dia.Element.define('iml.Attributes', {
    attrs: {
        attributeRect: {
            height: 25,
            width: 123,                 // This is the width of an attribute with the default text
            strokeWidth: 1,
            stroke: '#000000',
            fill: 'rgba(150,150,150,0.1)',
        },
		icon: {
			xlinkHref: 'Resources/optional.png',
			height: 15,
			width: 15,
			refX: 2,
			refY: 2,
		},
        attributeLabel: {
            ref: 'attributeRect',
            textVerticalAnchor: 'middle',
            textAnchor: 'left',
            refX: 20,                    // This needs to be relative for centering
            refY: '50%',                    // This needs to be relative for centering
            fontSize: 12,
        },
    }
}, { 
    markup: [
        {
            tagName: 'rect',
            selector: 'attributeRect'
        }, 
		{
			tagName: 'image',
			selector: 'icon'
		},
        {
            tagName: 'text',
            selector: 'attributeLabel'
        }
    ]
});

var ImlInheritanceElement = joint.dia.Link.define('iml.Inheritance', {
    // This is how markup is defined in the default attributes. I could not figure out how to use the object
    // definitions like in the other custom elements. It might be worth figuring out how to use the object definitions
    // just so that the code is consistent.
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

var ImlCompositionElement = joint.dia.Link.define('iml.Composition', {
    // This is how markup is defined in the default attributes. I could not figure out how to use the object
    // definitions like in the other custom elements. It might be worth figuring out how to use the object definitions
    // just so that the code is consistent.
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

var ImlReferenceElement = joint.dia.Link.define('iml.Reference', {
    // This is how markup is defined in the default attributes. I could not figure out how to use the object
    // definitions like in the other custom elements. It might be worth figuring out how to use the object definitions
    // just so that the code is consistent.
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