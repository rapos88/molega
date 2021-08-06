function getDataUrl(img) {
   // Create canvas
   const canvas = document.createElement('canvas');
   const ctx = canvas.getContext('2d');
   canvas.width = img.getAttribute('width');
   canvas.height = img.getAttribute('height');
   ctx.drawImage(img, 0, 0);
   return canvas.toDataURL('image/png');;
}

function exportAsPNG(){
	exportAsImage(false);
}

function exportAsSVG(){
	exportAsImage(true);
}

function exportAsImage(exportSVG){
	for(var i = 0; i < highlightedElement.length; i++)
		highlightedElement[i].unhighlight();
	
	
	var svgDocOrig = paper.svg;
	let svgDoc = svgDocOrig.cloneNode(true);
	
	var width = svgDocOrig.getBBox().x + svgDocOrig.getBBox().width + 10;
	var height = svgDocOrig.getBBox().y + svgDocOrig.getBBox().height + 10;
	
	
	var linkTools = svgDoc.getElementsByClassName('link-tools');
    while(linkTools.length > 0){
        linkTools[0].parentNode.removeChild(linkTools[0]);
    }
	var arrowHeads = svgDoc.getElementsByClassName('marker-arrowheads');
    while(arrowHeads.length > 0){
        arrowHeads[0].parentNode.removeChild(arrowHeads[0]);
    }
	var connectionWrap = svgDoc.getElementsByClassName('connection-wrap');
    while(connectionWrap.length > 0){
        connectionWrap[0].parentNode.removeChild(connectionWrap[0]);
    }
	var markers = svgDoc.getElementsByClassName('marker-vertices');
    while(markers.length > 0){
        markers[0].parentNode.removeChild(markers[0]);
    }
	var connection = svgDoc.getElementsByClassName('connection');
    for (var i = 0; i < connection.length; i++){
		connection[i].setAttribute('fill', 'none');
	}
	var label = svgDoc.getElementsByClassName('label');
    for (var i = 0; i < label.length; i++){
		label[i].setAttribute('font-weight', '700');
	}
	
	var images = $(svgDoc).find('image');
	for (var x = 0; x < images.length; x++){
		dataUrl = getDataUrl(images[x]);
		images[x].setAttribute('xlink:href', dataUrl);
	}
	
	var serializer = new XMLSerializer();
	var data = serializer.serializeToString(svgDoc);
	data = data.replace(/xml:space="preserve"/g, 'xml:space="preserve" font-family="Helvetica Neue,Helvetica,Arial,sans-serif"');
	var W = 'width="' + width + '"';
	var H = 'height="' + height + '"';
	data = data.replace(/width="100%"/g, W);
	data = data.replace(/height="100%"/g, H);
	
	
		
	if (exportSVG){
		document.getElementById('imageSVG').setAttribute('href', "#");
		document.getElementById('imageSVG').setAttribute('download', "");
		window.URL = window.URL || window.webkitURL;
		var fileName = imlStructuralModel.fileName.replace('.iml','.svg');
		var file = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
			
		document.getElementById('imageSVG').setAttribute('href', window.URL.createObjectURL(file));
		document.getElementById('imageSVG').setAttribute('download', fileName);
	}
	else{
		/* SVG to PNG (c) 2017 CY Wong / myByways.com */
		/* https://mybyways.com/blog/convert-svg-to-png-using-your-browser */

		
		var svg = null;
		var div = document.getElementById('d');
		div.hidden = false;
		div.innerHTML= data;
		svg = div.querySelector('svg');
		var width = svg.getBoundingClientRect().width;
		var height = svg.getBoundingClientRect().height;
		var canvas = document.createElement('canvas');
		svg.setAttribute('width', width);
		svg.setAttribute('height', height);
		canvas.width = width;
		canvas.height = height;
		var data = new XMLSerializer().serializeToString(svg);
		var win = window.URL || window.webkitURL || window;
		var img = new Image();
		var blob = new Blob([data], { type: 'image/svg+xml' });
		var url = win.createObjectURL(blob);
		img.onload = function () {
			var ctx = canvas.getContext('2d')
			ctx.drawImage(img, 0, 0);
			ctx.globalAlpha = 1;
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.filter = "none";
			ctx.globalCompositeOperation = "destination-over";
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.restore();
			win.revokeObjectURL(url);
			var uri = canvas.toDataURL('image/png').replace('image/png', 'octet/stream');
			var a = document.createElement('a');
			document.body.appendChild(a);
			a.style = 'display: none';
			a.href = uri
			a.download = imlStructuralModel.fileName.replace('.iml','.png');
			a.click();
			window.URL.revokeObjectURL(uri);
			document.body.removeChild(a);
		};
		img.src = url;
		div.hidden = true;
	}
	for(var i = 0; i < highlightedElement.length; i++)
		highlightedElement[i].highlight();
	
}

function HtmlEncode(s) {
	return s.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function exportStructuralModel(downloadToElement, imlModel, graph, routingMode, instanceEditor, save = false) {
    if(!save) {
		// Resets export attributes so the previous is not downloaded if the current export fails.
    	downloadToElement.setAttribute('href', "#");
    	downloadToElement.setAttribute('download', "");
	}

    var xml = '<iml version="0.1">\n';

    var modelName = imlModel.name;
    xml += '\t<StructuralModel name="'+ modelName +'" conformsTo="' + imlModel.conformsTo +'" routingMode="' + routingMode + '">\n\n';
    
    try {

        xml += '\t\t<Classes>\n'
        imlModel.classes.forEach(imlClass => {

            imlClassView = graph.getCell(imlClass.id);

            xml += '\t\t\t<Class';
            xml += ' name="'        + imlClass.name                                 + '"';
            xml += ' isAbstract="'  + String(imlClass.isAbstract).toUpperCase()     + '"';
			xml += ' x="'           + Math.trunc(imlClassView.position().x)         + '"';
            xml += ' y="'           + Math.trunc(imlClassView.position().y)         + '"';
			xml += ' id="'          + imlClass.id                     				+ '"';
            
            if(imlClass.attributes.size != 0) {
            
                xml += '>\n'; // Close Class opening tag because class will be multiple lines.

                imlClass.attributes.forEach(imlAttribute => {
					
					//given run time checking, this should never happen, but updated to be sure
                    if(String(imlAttribute.upperBound).localeCompare("*") != 0) {
						if(imlAttribute.lowerBound > imlAttribute.upperBound) {
							throw new Error('Relation "' + imlAttribute.name + '" has a lower bound that is greater than the upper bound.');
						}
					}

                    xml += '\t\t\t\t<Attribute';
                    xml += ' visibility="'  + imlAttribute.visibility   + '"';
                    xml += ' name="'        + imlAttribute.name         + '"';
                    xml += ' type="'        + imlAttribute.type         + '"';
                    
					if(imlAttribute.value) { // Check for assigned value
                        xml += ' value="';
						if(Array.isArray(imlAttribute.value)){
							xml+= '[';
							for (var i = 0; i < imlAttribute.value.length; i++){
								xml+= imlAttribute.value[i];
								if (i != imlAttribute.value.length -1)
									xml+= ',';
							}
							
							xml+= ']';
						}
						else
							xml+= HtmlEncode(imlAttribute.value);
						xml+= '"';
                    }
                    
					
					xml += ' lowerBound="'  + imlAttribute.lowerBound   + '"';
                    xml += ' upperBound="'  + imlAttribute.upperBound   + '"';
                    xml += ' position="'    + imlAttribute.position     + '"';
                    xml += ' />\n';

                });

                xml += '\t\t\t</Class>\n';

            } else {
                xml += ' />\n'; // Implement single line version of Class.
            }

        });

        xml += '\t\t</Classes>\n'

        xml += '\n\t\t<Relations>\n'
        imlModel.relations.forEach(imlRelation => {
			xml += '\t\t\t<Relation';
            xml += ' source="'      + imlModel.classes.get(imlRelation.source).id         + '"';
            xml += ' destination="' + imlModel.classes.get(imlRelation.destination).id    + '"';
			var imlRelationView = graph.getCell(imlRelation.id);
			
            if(imlRelation instanceof ImlInheritance) {
                xml += ' type="'     + ImlRelationType.INHERITENCE + '"';
            } else {
                if(imlRelation instanceof ImlComposition) {
                    xml += ' type="' + ImlRelationType.COMPOSITION + '"';
                } else { // ImlRelationType = REFERENCE
                    xml += ' type="' + ImlRelationType.REFERENCE + '"';
                }

                if(String(imlRelation.upperBound).localeCompare("*") != 0) {
                    if(imlRelation.lowerBound > imlRelation.upperBound) {
                        throw new Error('Relation "' + imlRelation.name + '" has a lower bound that is greater than the upper bound.');
                    }
                }
                
                
				if(!instanceEditor){
					var boundDistance = imlRelationView.labels()[1].position.distance;
					var boundOffset = imlRelationView.labels()[1].position.offset;
				}
				else{
					var boundDistance = 0;
					var boundOffset = 0;
				}
                

                xml += ' name="'                + imlRelation.name                                  + '"';
                xml += ' lowerBound="'          + imlRelation.lowerBound                            + '"';
                xml += ' upperBound="'          + imlRelation.upperBound                            + '"';
                xml += ' nameDistance="'        + imlRelationView.labels()[0].position.distance     + '"';
                xml += ' boundDistance="'       + boundDistance      								+ '"';
                xml += ' nameOffset="'          + imlRelationView.labels()[0].position.offset       + '"';
                xml += ' boundOffset="'         + boundOffset       								+ '"';
            }
			
			if(imlRelationView.attributes.vertices && imlRelationView.attributes.vertices.length > 0){
				xml += '>\n';
				for (var index = 0; index < imlRelationView.attributes.vertices.length; index++){
					var xPos = imlRelationView.attributes.vertices[index].x;
					var yPos = imlRelationView.attributes.vertices[index].y;
					xml += '\t\t\t\t<Point x="' + xPos + '" y="' + yPos + '" />\n';
				}
				xml += '\t\t\t</Relation>\n';
			}
			else{
				xml += ' />\n';
			}
        }); 

        xml += '\t\t</Relations>\n\n'

        xml += '\t</StructuralModel>\n';
        xml += '</iml>\n';

        // File creation and download tutorial by, Tuts & Tips: https://www.tutsandtips.com/javascript/how-to-download-a-text-file-with-javascript/

        var fileName = imlModel.fileName;
        var file = new Blob([xml], {type: 'text/plain'});

		//check if we are saving model
		if(save) {
			//call saveModel function from structuralModeling.js
			//fileName, content
			saveModel(fileName, xml);
		} else {
			window.URL = window.URL || window.webkitURL;

			downloadToElement.setAttribute('href', window.URL.createObjectURL(file));
			downloadToElement.setAttribute('download', fileName);
		}
    } catch (error) {
        var msg = error.toString().replace("Error: ", "");
		swal("IML: Model Import Error", msg, "error");
    }
}
