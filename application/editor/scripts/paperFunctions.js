

function dragPaper(paper, htmlElement, x, y, pointerStart, boundPanByModel=false) {
    htmlElement.css('cursor', 'grabbing');

    var translateX = x - pointerStart.x;
    var translateY = y - pointerStart.y;

    scale = paper.scale().sx;
    // If paper gets zoomed out too far.
    if(scale < .7) {
        // Scale down movements with zoom.
        translateX = translateX * scale;
        translateY = translateY * scale;
    }
    
    var newOriginX = paper.options.origin.x + translateX;
    var newOriginY = paper.options.origin.y + translateY;

    if(newOriginX > 0) {
        newOriginX = 0;
    } 
    
    if(newOriginY > 0) {
        newOriginY = 0;
    }

    if(boundPanByModel) {
        if(Math.abs(newOriginX) > paper.getContentArea().width * scale) {
            newOriginX = paper.options.origin.x;
        }

        if(Math.abs(newOriginY) > paper.getContentArea().height * scale) {
            newOriginY = paper.options.origin.y;
        }
    }
    paper.setOrigin(newOriginX, newOriginY);
}

function zoomPaper(delta, paper, lowerBound, upperBound) {
    var scale = paper.scale().sx;
    var xScale = paper.scale().sx;
    var yScale = paper.scale().sy;
    const scaleShift = 0.1 * delta;
    xScale += scaleShift;
    yScale += scaleShift;

    // Bound 70% to 200%
    if(xScale >= lowerBound && xScale < upperBound) {
        paper.scale(xScale, yScale);    
        var zoomPercent = Math.round(xScale * 100);
        $('#zoomScale').show().html(zoomPercent + '% zoom');
        $('#zoomScale').delay(3000).fadeOut('slow');
    }

    // Readjust origin when model goes off screen.
    newOriginX = paper.options.origin.x;
    // if x coordinate of origin is further than content width, readjust
    if(Math.abs(newOriginX) > paper.getContentArea().width * scale) {
        newOriginX = -paper.getContentArea().width * scale;
    }

    newOriginY = paper.options.origin.y;
    // if y coordinate of origin is further than content height, readjust
    if(Math.abs(newOriginY) > paper.getContentArea().height * scale) {
        newOriginY = -paper.getContentArea().height * scale;
    }
    
    paper.setOrigin(newOriginX, newOriginY);
}