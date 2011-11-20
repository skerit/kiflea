/**
 *Draw the queued text
 */
function drawTextQueue(){

    for(message in textObjects){
        k.links.canvas.ctx.fillStyle = textObjects[message]['style']['background'];  
        k.links.canvas.ctx.fillRect (textObjects[message]['style']['dx'], textObjects[message]['style']['dy'], textObjects[message]['style']['dwidth'], textObjects[message]['style']['dheight']);
        k.links.canvas.ctx.fillStyle = textObjects[message]['style']['color'];  
        k.links.canvas.ctx.strokeStyle = textObjects[message]['style']['color'];  
        k.links.canvas.ctx.font = textObjects[message]['style']['size'] + "px " + textObjects[message]['style']['font'];
        
        var charHeight = textObjects[message]['style']['height']*textObjects[message]['style']['size'];
        
        var charsPerLine = textObjects[message]['charsPerLine']; // A variable used later
        
        // Show 2 lines at once
        for(var loop = 0; loop < 2; loop++){
            var cursor = loop + textObjects[message]['cursor'];
            
            if(textObjects[message]['text'][cursor] !== undefined) {
                var dx = textObjects[message]['style']['dx']+textObjects[message]['style']['hBorder'];
                var dy = (textObjects[message]['style']['dy'])+((charHeight)*(1+(cursor%2))) + textObjects[message]['style']['vBorder'] - charHeight/4;
                k.links.canvas.ctx.strokeText(textObjects[message]['text'][cursor], dx, dy);
            }
        }
        
        if(textObjects[message]['style']['dialog'] !== undefined) {
            var dx = textObjects[message]['style']['dx'];
            var dy = textObjects[message]['style']['dy'];

            drawDialog(textObjects[message]['style']['dialog'], dx, dy, textObjects[message]['style']['dwidth']+hudLayers['dialog'][textObjects[message]['style']['dialog']]['topleft']['width']*2,
                       textObjects[message]['style']['dheight']+hudLayers['dialog'][textObjects[message]['style']['dialog']]['topleft']['height']*2);
        }
        

        // This item has been shown for a frame more
        textObjects[message]['fpsshown']++;
        
        // If the item has been shown too long, increment the cursor
        if(textObjects[message]['fpsshown'] > (fpsr*(0.11 * charsPerLine))){

            // If the cursor hasn't reached as many pieces yet, there is more text to show
            if(textObjects[message]['cursor']+2 < textObjects[message]['pieces']){
                textObjects[message]['cursor'] = textObjects[message]['cursor'] + 2;
                
                // Don't forget to reset the fpsshown
                textObjects[message]['fpsshown'] = 0;
                
            } else { // If it has, remove this text object
                textObjects.splice(0,1);
            }
        }

        // Hmm, we only have to get the first item. We should rewrite this a bit.
        break;

    }
}