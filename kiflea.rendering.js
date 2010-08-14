/*
	This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
	
	Author: Jelle De Loecker
	Version: Trunk
	Last Modified: Trunk
*/

/**
 *Start rendering the scene 'till infinity
 */
function renderLoop(){
    
    // If we haven't loaded everything yet don't continue
    if(loaded<toLoad) return;

    // If msf isn't defined this is the actual beginning and everything has loaded
    // We still need those walkable tiles, though.
    if(msf === undefined) {

        debugEcho('Fetching walkable tiles');
        toLoad++;
        //Loop through every map and fetch the walkable tiles
        for(map in maps) maps[map]['walkableTiles'] = getWalkableTiles(map);
        
        // We can finally start
        debugEcho('The engine has started');
        loaded++;
        
        // Just for debugging the effects!
        for (var objectId in animatedObjects){
            for(var effectNr = 0; effectNr < animatedObjects[objectId]['effects'].length; effectNr++){   
                animatedObjects[objectId]['effects'][effectNr]['started'] = now();
            }
        }
        
    }

    // Start the fake ms counter
    msfTimer = (new Date()).getTime();
    
    // If this map has a backgroundcolor set, use it.
    if(maps[animatedObjects[userPosition.uid]['map']]['properties']['backgroundcolor'] !== undefined){
        backgroundColor = maps[animatedObjects[userPosition.uid]['map']]['properties']['backgroundcolor'];
    }
    
    // Clear the canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    fakePress(); // Simulate autorepeating keypresses
    
    doActionsReceived(); // Do the actions every object has received
    
    prerenderMoveObjects(); // Calculate every objects next xy coordinates

    prerenderMapOffset(); // Calculate the map offset
    


    // Loop through the layers and render them
    for(var layerName in maps[animatedObjects[userPosition.uid]['map']]['layers']) {

        renderLayer(layerName); // Render this layer

        // If this layer has the "drawUsers" property set to "1"
        // We draw all the objects on top of it.
        if(maps[animatedObjects[userPosition.uid]['map']]['layers'][layerName]['properties']['drawUsers']==1){
            
            highlightSelectedObject(); // Draw a circle underneath our selection
            
            // If we've enabled pathfinding debug, draw the testpath array
            if(debugPathOn == true) drawTestPath();

            renderObjects(layerName); // Render every object
        }
    };

    // Calculate fake ms & fps (time it took to draw this loop)
    msf = (now() - msfTimer);
    fpsf = (1000/msf);
    
    // Calculate real ms & fps (time it took to draw this loop + gap between loop)
    msr = (now() - msrTimer);
    fpsr = (1000/msr);
    
    // Draw a grid over the screen.
    if(debugGrid == true) drawDebugGrid();

    // Clear the sameFrame variable, used by animated tiles
    sameFrame = {};

    // Start the real fps counter
    msrTimer = now();

    // Draw the HUD
    drawHud();

    // If we've enabled debugging, we actually want the fps (bad name, I know)
    // Draw it on the canvas for better framerates
    if(debugOn==true) drawDebugFps();
    
    // Now start showing text objects
    for(message in textObjects){
        ctx.fillStyle = "rgba(20, 20, 20, 0.7)";  
        ctx.fillRect (2, canvasHeight-99, canvasWidth-4, 55);
        ctx.strokeStyle = "white";  
        ctx.font = "15px monospace";
        
        
        // Show 2 lines at once
        for(var loop = 0; loop < 2; loop++){
            var cursor = loop + textObjects[message]['cursor'];
            
            if(textObjects[message]['text'][cursor] !== undefined) {
                ctx.strokeText(textObjects[message]['text'][cursor], 5, (canvasHeight-80)+(20*(cursor%2)));
            }
        }
        

        // This item has been shown for a frame more
        textObjects[message]['fpsshown']++;
        
        // If the item has been shown too long, increment the cursor
        if(textObjects[message]['fpsshown'] > (fpsr*3)){

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

/**
 *Get the objectID of the current selection
 *@returns  {string}    The objectId of the current selection
 */
function getSelectedObject(){
    
    if(animatedObjects[userPosition.uid]['selection'] !== undefined) {
        return animatedObjects[userPosition.uid]['selection'];
    } else {
        return;
    }
}

/**
 *Draw a circle under our selection
 */
function highlightSelectedObject(){
    
    // Draw a little square under our selection if we have one
    if(animatedObjects[userPosition.uid]['selection'].length  > 0){
        
        var selectionC = getRealCoordinates(animatedObjects[userPosition.uid]['selection']);
        
        ctx.beginPath();
        ctx.fillStyle = "rgba(0,0,255,0.3)";
        ctx.strokeStyle = "rgba(0,0,0,0.8)";
        ctx.arc(selectionC['x']+(maps[animatedObjects[userPosition.uid]['map']]['tileWidth']/2),selectionC['y']-(maps[animatedObjects[userPosition.uid]['map']]['tileHeight']/2),maps[animatedObjects[userPosition.uid]['map']]['tileWidth']/2,0,Math.PI*2,true);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }
}


/**
 *Render the effects of an object
 *@param    objectId    {string}    The object of which to render the effects
 */
function renderEffects(objectId){

    // Loop through every effect
    for(var effectNr = 0; effectNr < animatedObjects[objectId]['effects'].length; effectNr++){
        
        var sx = animatedObjects[objectId]['effects'][effectNr]['sx'];
        var sy = animatedObjects[objectId]['effects'][effectNr]['sy'];
        var dx = animatedObjects[objectId]['effects'][effectNr]['dx'];
        var dy = animatedObjects[objectId]['effects'][effectNr]['dy'];
        var x = animatedObjects[objectId]['effects'][effectNr]['x'];
        var y = animatedObjects[objectId]['effects'][effectNr]['y'];
        var baseSprite = animatedObjects[objectId]['effects'][effectNr]['sprite'];
        var baseTilesetInfo = getTileSetInfo(defaultSprites, baseSprite);
        
        animatedObjects[objectId]['effects'][effectNr]['msMoved'] = now() - animatedObjects[objectId]['effects'][effectNr]['started'];
        
        // How much do we need to move?
        var moveAmmountX = (dx - sx);
        var moveAmmountY = (dy - sy);
        
        // How much should we have moved already?
        var objectMoveProgressX = animatedObjects[objectId]['effects'][effectNr]['msMoved']/(animatedObjects[objectId]['effects'][effectNr]['msPerTile']*Math.abs(moveAmmountX));
        var objectMoveProgressY = animatedObjects[objectId]['effects'][effectNr]['msMoved']/(animatedObjects[objectId]['effects'][effectNr]['msPerTile']*Math.abs(moveAmmountY));

        // Only calculate the new x-y coordinates if we haven't reached our goal yet
        if(objectMoveProgressX < 1) animatedObjects[objectId]['effects'][effectNr]['x'] = sx + ((dx - sx)*objectMoveProgressX);
        if(objectMoveProgressY < 1) animatedObjects[objectId]['effects'][effectNr]['y'] = sy + ((dy - sy)*objectMoveProgressY);
        
        var coordinates = getRealCoordinates(null,x, y);
        
        // Only for objects and effects: when an adjustx and/or an adjusty is given as a tileproperty, apply it
        // This is because BIG animations (like the explosion) still take only one tile on the map.
        // And it starts at the bottom left tile.
        if(getTileProperty(baseTilesetInfo['tileSetName'], baseSprite, "adjustx") !== undefined){
            coordinates['x'] += parseFloat(getTileProperty(baseTilesetInfo['tileSetName'], baseSprite, "adjustx"));
        }

        if(getTileProperty(baseTilesetInfo['tileSetName'], baseSprite, "adjusty") !== undefined){
            coordinates['y'] += parseFloat(getTileProperty(baseTilesetInfo['tileSetName'], baseSprite, "adjusty"));
        }

        // Now get the currentsprite data based on the direction of the effect
        var direction = getAngle(x, y, dx, dy);
        var dText = getAngleDirection(direction);

        // If this effect has directional tiles...
        if(tileProperties[baseTilesetInfo['tileSetName']][baseSprite]['directional'] == 1){

            switch(dText){
    
                case 'right':
                    animatedObjects[objectId]['effects'][effectNr]['currentsprite'] = tileProperties[baseTilesetInfo['tileSetName']][baseSprite]['righttile'];
                    break;
    
                case 'rightup':
                    animatedObjects[objectId]['effects'][effectNr]['currentsprite'] = tileProperties[baseTilesetInfo['tileSetName']][baseSprite]['rightuptile'];
                    break;
    
                case 'up':
                    animatedObjects[objectId]['effects'][effectNr]['currentsprite'] = tileProperties[baseTilesetInfo['tileSetName']][baseSprite]['uptile'];
                    break;
    
                case 'leftup':
                    animatedObjects[objectId]['effects'][effectNr]['currentsprite'] = tileProperties[baseTilesetInfo['tileSetName']][baseSprite]['leftuptile'];
                    break;
    
                case 'left':
                    animatedObjects[objectId]['effects'][effectNr]['currentsprite'] = tileProperties[baseTilesetInfo['tileSetName']][baseSprite]['lefttile'];
                    break;
    
                case 'leftdown':
                    animatedObjects[objectId]['effects'][effectNr]['currentsprite'] = tileProperties[baseTilesetInfo['tileSetName']][baseSprite]['leftdowntile'];
                    break;
    
                case 'down':
                    animatedObjects[objectId]['effects'][effectNr]['currentsprite'] = tileProperties[baseTilesetInfo['tileSetName']][baseSprite]['downtile'];
                    break;
    
                case 'rightdown':
                    animatedObjects[objectId]['effects'][effectNr]['currentsprite'] = parseInt(tileProperties[baseTilesetInfo['tileSetName']][baseSprite]['rightdowntile']);
                    break;
            }
    
            // Correct the currentsprite if we've changed it using directions (as these sprites have the wrong gid)
            var currentSprite = parseInt(animatedObjects[objectId]['effects'][effectNr]['currentsprite']) + (parseInt(baseTilesetInfo['firstgid'])-1);
        } else {
            // If we don't modify the direction, just use the basesprite.
            var currentSprite = parseInt(animatedObjects[objectId]['effects'][effectNr]['currentsprite'])
        }

        try{
            drawTile(currentSprite, coordinates['x'], coordinates['y'], null, objectId, animatedObjects[objectId]['effects'][effectNr]['id']); // The given id contains the ID, but not yet the tilenumberonmap
        } catch (error){
            debugEcho('Error drawing ' + dText + ' of baseSprite ' + baseSprite + ' namely: ' + currentSprite + ' -- ' + error);
        }
        
        var animationId = objectId + '-' + animatedObjects[objectId]['effects'][effectNr]['id'] + '-' + currentSprite;
        
        try {

            // If we have reached our destination
            if(objectMoveProgressX > 1 && objectMoveProgressY > 1){
                
                // And if we've played the effect one full time OR (it was a moving object OR it has an aftereffect)
                if(animatedTiles[baseTilesetInfo['tileSetName']][animationId]['played'] > 0 || ((dx != sx || dy != sy) || animatedObjects[objectId]['effects'][effectNr]['aftereffect'] !== undefined)){
                    
                    if(animatedObjects[objectId]['effects'][effectNr]['aftereffect'] !== undefined){
                        animatedObjects[objectId]['effects'].push({'sprite': animatedObjects[objectId]['effects'][effectNr]['aftereffect'],
                                                                  'currentsprite': animatedObjects[objectId]['effects'][effectNr]['aftereffect'],
                                                                  'dx': animatedObjects[objectId]['effects'][effectNr]['x'],
                                                                  'dy': animatedObjects[objectId]['effects'][effectNr]['y'],
                                                                  'sx': animatedObjects[objectId]['effects'][effectNr]['x'],
                                                                  'sy': animatedObjects[objectId]['effects'][effectNr]['y'],
                                                                  'x': animatedObjects[objectId]['effects'][effectNr]['x'],
                                                                  'y': animatedObjects[objectId]['effects'][effectNr]['y'],
                                                                  'msPerTile': 100,
                                                                  'msMoved': 100,
                                                                  'started': now(),
                                                                  'id': rand(1000)});
                    }
                    
                    // And finally, remove this effect from the user
                    animatedObjects[objectId]['effects'].splice(effectNr,1);
                    
                    // And from the animatedTiles array (However: this won't delete the tiles from before we changed direction)
                    delete animatedTiles[baseTilesetInfo['tileSetName']][animationId];
                }
            }
        } catch(error){
            debugEcho('Error finishing effect of baseSprite ' + baseSprite + ' - animationid ' + animationId + '  - dtext: ' + dText + ' - ' + error);
        }
        
    }
    
}

/**
 *Render every object
 */
function renderObjects(){
    
    // Loop through every object
    for (var objectId in animatedObjects){
        
        // If this object isn't on the same map as our user, continue to the next object
        if(animatedObjects[objectId]['map'] != animatedObjects[userPosition.uid]['map']) continue;
        
        // If this is our own user, set the coordinates at the center of the screen.
        if(objectId == userPosition.uid) {
            var objX = (canvasWidth - maps[animatedObjects[userPosition.uid]['map']]['tileWidth']) / 2;
            var objY = (canvasHeight - maps[animatedObjects[userPosition.uid]['map']]['tileHeight']) / 2;
            
            // When the screen is the correct multiple of the tilewidth, but half of it isn't an integer
            // we need to take that into account.
            if(objX % maps[animatedObjects[userPosition.uid]['map']]['tileWidth'] != 0){
                objX = objX - (objX % maps[animatedObjects[userPosition.uid]['map']]['tileWidth']);
            }
            if(objY % maps[animatedObjects[userPosition.uid]['map']]['tileHeight'] != 0){
                objY = objY - (objY % maps[animatedObjects[userPosition.uid]['map']]['tileHeight']);
            }
            
        } else {
            
            // Get the real coördinates of the object (pixels on the canvas in relation to our user)
            var objC = getRealCoordinates(objectId);
            
            var objX = objC['x'];
            var objY = objC['y'];
        }
        // Loop through all the layers of this object
        for (var spriteNr = 0; spriteNr < animatedObjects[objectId]['spritesToDraw'].length; spriteNr++){
            
            if(objectId == userPosition.uid){
                debugEchoLfps('Drawing own user ' + objectId + ' layer nr ' + spriteNr + ' - namely: ' + animatedObjects[objectId]['spritesToDraw'][spriteNr] );
            }
            
            drawTile(animatedObjects[objectId]['spritesToDraw'][spriteNr], objX, objY, null, objectId);
        }
        
        // Draw the effects of this user
        renderEffects(objectId);
        
        
    }
}

/**
 *Render a specific layer
 *@param    layerName   {string}    The name of the layer to draw of the current map
 */
function renderLayer(layerName){
    
    // For every visible row (+ the drawExtras row, needed for tiles that are bigger than the default map tile)
    for (var tileY = 0; tileY <= visibleTilesY+drawExtras; tileY++) {
        
        // And for every tile in that row (+ the drawExtras)
        for (var tileX = (0-drawExtras); tileX <= visibleTilesX; tileX++) {
            
            // Calculate the coördinates of the tile we need, based on our current position
            // (Example: The tile in row 10, column 5)
            var rowTile = animatedObjects[userPosition.uid]['x'] + (tileX + (Math.floor(visibleTilesX / 2))+1) - visibleTilesX;
            
            // Do not continue if rowTile is negative or bigger than the width of the map
            if(rowTile < 0 || rowTile >= maps[animatedObjects[userPosition.uid]['map']]['width']) continue;
            
            var colTile = animatedObjects[userPosition.uid]['y'] + (tileY + (Math.floor(visibleTilesY / 2))+1) - visibleTilesY;

            // Do not continue if colTile is negative or bigger than the height of the map
            if(colTile < 0 || colTile >= maps[animatedObjects[userPosition.uid]['map']]['height']) continue;
            
            // Now that we know what piece of the map we need
            // we need to get the corresponding tileset image
            var tileNumber = getLayerTile(animatedObjects[userPosition.uid]['map'], layerName, Math.floor(rowTile), Math.floor(colTile));
            
            // When we get to an empty tile we can skip towards the next loop
            if(tileNumber == 0 || tileNumber === undefined) continue;

            // Now calculate where to draw this tile, based on the size of the tiles of the map, not the tileset
            var destinationX = (tileX * maps[animatedObjects[userPosition.uid]['map']]['tileWidth']) - mappOffsetX;
            var destinationY = (tileY * maps[animatedObjects[userPosition.uid]['map']]['tileHeight']) - mappOffsetY;
            
            // And now draw that tile!
            try {
                drawTile(tileNumber, destinationX, destinationY);
            } catch(error) {
                debugEchoLfps('[renderLoop] Error drawing tilenumber <b>"' + tileNumber +
                              '"</b> from layer "<b>' + layerName + '</b>" - coordinates (<b>' + rowTile +
                              '</b>,<b>' + colTile + '</b>) to (<b>' +
                              destinationX + '</b>,<b>' + destinationY +
                              '</b>)'
                );
            }
        }
    }
}

/**
 *Draw FPS information on the canvas
 */
function drawDebugFps(){
    
    ctx.fillStyle = "rgba(20, 20, 20, 0.7)";  
    ctx.fillRect (2, canvasHeight-33, canvasWidth-4, 20);
    ctx.strokeStyle = "white";  
    ctx.font = "12px monospace";
    ctx.strokeText('Fake ms: ' + msf.toPrecision(4) + ' - Real ms: ' + msr.toPrecision(4)  + ' - Fake fps: ' + Math.round(fpsf).toPrecision(3) + ' - Real fps: ' + Math.round(fpsr).toPrecision(3), 5, canvasHeight-20);

}

/**
 *Draw a grid on the canvas
 */
function drawDebugGrid(){
    
        ctx.strokeStyle = "rgba(20, 20, 20, 0.7)";  
        
        // Draw horizontal lines
        for(var row = 0; row < (canvasWidth/debugGridX); row++ ){
            ctx.beginPath();
            ctx.moveTo(0, row*debugGridX);  
            ctx.lineTo(canvasWidth, row*debugGridX);
            ctx.stroke();
        }
        
        // Draw vertical lines
        for(var col = 0; col < (canvasWidth/debugGridY); col++ ){
            ctx.beginPath();
            ctx.moveTo(col*debugGridY, 0);  
            ctx.lineTo(col*debugGridY, canvasHeight);
            ctx.stroke();
        }
        
}
/**
 *Calculate the "mapOffset" of the user if we're moving when the map is drawn
 */
function prerenderMapOffset(){
    
    //Only do this if we're actually moving. This saves us a tiny ammount of speed.
    //It was a nice idea, but it only worked when moving left or up. Ugh
    //if(animatedObjects[userPosition.uid]['x'] != animatedObjects[userPosition.uid]['moveToX'] ||
    //   animatedObjects[userPosition.uid]['y'] != animatedObjects[userPosition.uid]['moveToY']){


        //This has to be floored, because pixels can't have a decimal value
        //And this would create 1 pixel spacing between the tiles while moving.
        mappOffsetX = Math.floor((maps[animatedObjects[userPosition.uid]['map']]['tileWidth'] * decimal(animatedObjects[userPosition.uid]['x'])));
        mappOffsetY = Math.floor((maps[animatedObjects[userPosition.uid]['map']]['tileHeight'] * decimal(animatedObjects[userPosition.uid]['y'])));
    //}

}

/**
 *Every object has to be moved gradually. This function makes sure the coordinates
 *of the object are in the correct place before drawing them later on.
 */
function prerenderMoveObjects(){

    for (var objectId in animatedObjects){
        
        // Apply the path to walk and move the object
        walkPath(objectId);
    }
}

/**
 *Get the REAL (on canvas) coördinates of something.
 *If the objectId is used x and y are fetched themselves, otherwise you
 *have to give them (logically)
 *@param    objectId    {string}    The ID of the object to draw
 *@param    x           {integer}   Optional x
 *@param    y           {integer}   Optional y
 *@param    tileWidth   {integer}   Optional tileWidth (Default is current map's tileWidth)
 *@param    tileHeight  {integer}   Optional tileHeight
 */
function getRealCoordinates(objectId, x, y, tileWidth, tileHeight){
    
    // Get the x and y coördinates if they haven't been given
    if(x === undefined) x = animatedObjects[objectId]['x'];
    if(y === undefined) y = animatedObjects[objectId]['y'];
    
    // Store the current map's tileWidth and Height, if it hasn't been given already
    if(tileWidth === undefined) tileWidth = maps[animatedObjects[userPosition.uid]['map']]['tileWidth'];
    if(tileHeight === undefined) tileHeight = maps[animatedObjects[userPosition.uid]['map']]['tileHeight'];

    tempWidth = ((canvasWidth - tileWidth) / 2);
    tempHeight = ((canvasWidth - tileHeight) / 2);

    // When the screen is the correct multiple of the tilewidth, but half of it isn't an integer
    // we need to take that into account.
    if(tempWidth % maps[animatedObjects[userPosition.uid]['map']]['tileWidth'] != 0){
        tempWidth = tempWidth - (tempWidth % maps[animatedObjects[userPosition.uid]['map']]['tileWidth']);
    }
    if(tempHeight % maps[animatedObjects[userPosition.uid]['map']]['tileHeight'] != 0){
        tempHeight = tempHeight - (tempHeight % maps[animatedObjects[userPosition.uid]['map']]['tileHeight']);
    }

    var objX = (tempWidth - (Math.floor(animatedObjects[userPosition.uid]['x']) * tileWidth)) + (x * tileWidth) - mappOffsetX;
    var objY = (tempHeight - (Math.floor(animatedObjects[userPosition.uid]['y']) * tileHeight)) + (y * tileHeight) - mappOffsetY;

    return({'x': objX, 'y': objY});
    
}

/**
 *Get the wanted property of a tile if it exists, else return
 */
function getTileProperty(tileSetName, tileNumber, propertyName){

    // First check if this tile actually has properties
    if(tileProperties[tileSetName][tileNumber] !== undefined){
        
        // Then check if th property exists
        if(tileProperties[tileSetName][tileNumber][propertyName] !== undefined){
            return tileProperties[tileSetName][tileNumber][propertyName];
        } else {
            return;
        }
    }
}

/**
 *Draw an animated tile
 *@param integer   tileNumber  The number of the tile in the tileset
 *@param float     dx          The destination X-coördinate
 *@param float     dy          The destination Y-coördinate
 *@param float     opacity     A number between 0 and 1 (can be 0 and 1)
 *                             Does nothing currently, as canvas does not
 *                             support adjusting the opacity of images.
 *@param integer   tileGidOnMap
 *@param string    objectId    If it's an object, give its ID.
 *@param    extraId     {integer}   If we need more of an ID
 */
function drawAnimated(tileSetName, tileNumber, dx,dy, opacity, tileGidOnMap, objectId, extraId){
    
    // World-animated tiles are identified by their tilenumber (so every instance
    // of one of these tiles has the same ID in the animation. That's what we want)
    // Object-animated tiles are identified by their objectId.
    // We need something to store one or the other in
    var animationId;
    
    // Now let's decide which one it is
    if(objectId === undefined) {
        animationId = tileGidOnMap;
    } else {
        animationId = objectId + '-' + extraId + '-' + tileGidOnMap;
    }
    
    // Check if this tile already exists in the array
    if(animatedTiles[tileSetName][animationId] === undefined){

        debugEchoLfps('Initiate new animated tile: ' + animationId);
        
        animatedTiles[tileSetName][animationId] = {
            "played": 0,
            "framessince": 0,
            "fps": tileProperties[tileSetName][tileGidOnMap]['fps'],
            "replay": tileProperties[tileSetName][tileGidOnMap]['replay'],
            "currentframe": tileGidOnMap,
            "nextframe": tileProperties[tileSetName][tileGidOnMap]['nextframe']
        };
    } else { // This isn't a new animation. We're continuing...
        // If the currentframe is zero it means this animation is over!
        if(animatedTiles[tileSetName][animationId]["currentframe"] == 0){
            return;
        } else { //If the animation isn't done, load some variables!
            // Nothing needs to be done
        }
    }
    
    // Create a variable to hold our currentFrame
    var currentFrame = animatedTiles[tileSetName][animationId]["currentframe"];
    
    debugEchoLfps('Going to draw animated tile "<b>' + currentFrame + '</b>"!');
    
    // We used to adjust tilenumber with their firstgid in drawTileSpecific, but that didn't make drawTileSpecific very specific.
    // Now we put one in drawTile and drawTileAnimated. Ideally we would stop using the tileGidOnMap for tileproperties, but
    // hey, this works.
    var adjustedFrame = currentFrame - (tileSet[tileSetName]['firstgid']-1);
    
    try {
        // Draw the current frame
        drawTileSpecific(
                         tileSetName,   // The name of the tileset
                         adjustedFrame, // The number of the tile
                         dx,            // The destination x position
                         dy             // The destination y position
                         );
        
        debugEchoLfps('Animated tile "<b>' + animatedTiles[tileSetName][animationId]['currentframe'] + '</b>" has been drawn');
        
    } catch(error) {
        debugEchoLfps('[drawAnimated] Error drawing <b>animated</b> tile "<b>' + animatedTiles[tileSetName][animationId]['currentframe'] + '</b>" from tileSet "<b>' + tileSetName + '</b>" to coordinates (<b>' + dx + '</b>,<b>' + dy + '</b>)');
    }
    
    checkSameFrame(tileSetName, tileGidOnMap, animationId); // See if we've already drawn this animation during this frame
        
    // Count the ammount of frames that need to pass before showing the next one
    frameWait = (fpsr / animatedTiles[tileSetName][animationId]["fps"]);
        
    // If there have been more frames than we should wait ...
    if(animatedTiles[tileSetName][animationId]["framessince"] >= frameWait){

        // This animation is ready for the next frame!
        animatedTiles[tileSetName][animationId]["currentframe"] = animatedTiles[tileSetName][animationId]["nextframe"];
        
        animatedTiles[tileSetName][animationId]["framessince"] = 0; // Reset the framessince

        // If there is no new nextframe, end or loop back
        if(getTileProperty(tileSetName, currentFrame, "nextframe") === undefined){
            
            animatedTiles[tileSetName][animationId]["played"]++;        // Add a play to the counter

            // If the replay of the animation is not equal to one it's not done yet
            if(animatedTiles[tileSetName][animationId]["replay"] != 1){

                // If the animation is bigger than zero (and one, as seen above) decrease the counter
                if(animatedTiles[tileSetName][animationId]["replay"]>0) animatedTiles[tileSetName][animationId]["replay"]--;
                
                // Don't forget to set the first tile again
                animatedTiles[tileSetName][animationId]['currentframe'] = tileGidOnMap;
                
            } else{
                // Setting the currentframe to zero will stop the animation the next time
                animatedTiles[tileSetName][animationId]["currentframe"] = 0;
            }
            
            animatedTiles[tileSetName][animationId]["framessince"] = 0; // Reset the framessince
            
        }else { // If there IS a nextframe, set it!
            
            // Without this IF everything still worked, but an error would still be thrown
            // because sometimes "tileProperties[tileSetName][currentFrame]" wouldn't exist.
            if(tileProperties[tileSetName][currentFrame] !==undefined){
                var tempNextFrame = tileProperties[tileSetName][currentFrame]['nextframe']; // Great, I forgot why this is different from the nextframe in the "if" outside this if. Look it up.
                
                // Set the new nextframe: back to the beginning or end it all?
                animatedTiles[tileSetName][animationId]['currentframe'] = tempNextFrame;
                
            }
            
        }
        
        
        
    }
    
    debugEchoLfps('Finished drawing animated frame');
}

/**
 *Has this animation been drawn already this frame?
 *Needed for world-animated tiles
 *sameFrame array gets cleared after every full frame drawn
 *@param    tileSetName     {string}
 *@param    tileGidOnMap    {integer}
 *@param    animationId     {string}
 */
function checkSameFrame(tileSetName, tileGidOnMap, animationId){

    // If this is a world-animated tile we're going to check if this is a new frame being drawn
    // We need to make sure this object exists before we actually look for something in it. Even if it is an object we're drawing
    if(sameFrame[tileSetName] === undefined) {
        // Initiate this tileset in the sameFrame array   
        sameFrame[tileSetName] = {};
    }

    if(sameFrame[tileSetName][tileGidOnMap] === undefined) {
        
        // Make sure we've already created this tileSetName in the array before doing the next write
        if(sameFrame[tileSetName] === undefined) sameFrame[tileSetName] = {};
        
        // Say that the current tile has already been drawn this frame.
        // This will prevent the framessince counter from being increased
        // if this same tile is on the map multiple times.
        // Without this the framerate would double if there were 2 of these.
        sameFrame[tileSetName][animationId] = true;
        
        // Add a frame to the counter
        animatedTiles[tileSetName][animationId]["framessince"]++;
        
    }
}

/**
 *Draw a tile from the current map
 *@param integer   tileNumber  The number of the tile in the tileset
 *@param float     dx          The destination X-coördinate
 *@param float     dy          The destination Y-coördinate
 *@param float     opacity     A number between 0 and 1 (can be 0 and 1)
 *                             Does nothing currently, as canvas does not
 *                             support adjusting the opacity of images.
 *@param integer   object      If we want to draw an object we have to give
 *                             its id
 *@param    extraId      {integer}      An extra id, mainly for animations
 */
function drawTile(tileNumber, dx, dy, opacity, objectId, extraId) {
    
    // The name of the tileset we will pass on
    var tileSetName;
    var tileSetTpr;
    var sourceMap;  // From which map do we have to fetch the tilesets?
    
    // If this isn't an object the sourcemap is the current map we're on
    if(objectId === undefined) {
        sourceMap = animatedObjects[userPosition.uid]['map'];
    }else {
        // If it is an object we have to get the tilesets from the default "map". Hackish, but it works
        sourceMap = defaultSprites;
        
        // We also have to determine if the object is moving.
        if(animatedObjects[objectId]['moveToX'] != animatedObjects[objectId]['x']
           || animatedObjects[objectId]['moveToY'] != animatedObjects[objectId]['y']
           || animatedObjects[objectId]['path'].length > 0
           || (now() - animatedObjects[objectId]['lastMoved']) < 300){
            var movingObject = true; // Is this object moving?
        }
    }
    //if(objectId == userPosition.uid) debugEcho(now() - animatedObjects[objectId]['lastMoved']);
    // We know the map and the tilenumber, but not the tilesetname.
    // Look that up using our getTileSetInfo function.
    tileSetInfo = new getTileSetInfo(sourceMap, tileNumber);
    tileSetName = tileSetInfo['tileSetName'];
    tileSetTpr = tileSetInfo['tpr'];

    // We're going to fix the tileNumber next (to get the right tilenumber of the
    // map, not the tileset) But in the tileProperties object they are still stored
    // by their map tilenumber, which is logical.
    var tileGidOnMap = tileNumber;

    // tileNumbers are fixed per MAP, not per tileset.(So a second tileset in a
    // map wouldn't start from 1 but from 21, for example.)
    // We still need to know which piece to get from the tileset, so this fixes that
    tileNumber = tileNumber - (maps[sourceMap]['tilesets'][tileSetName]['firstgid']-1);

    if(tileProperties[tileSetName][tileGidOnMap] != undefined &&
       (tileProperties[tileSetName][tileGidOnMap]['beginanimation'] != undefined || movingObject == true)){
        try {
            drawAnimated(tileSetName, tileNumber, dx,dy, opacity, tileGidOnMap, objectId, extraId);
            
        } catch(error) {
            debugEchoLfps('[drawTile] Error drawing <b>animated</b> tile "<b>' + tileNumber + '</b>" from tileSet "<b>' + tileSetName + '</b>" to coordinates (<b>' + dx + '</b>,<b>' + dy + '</b>)'
            );
        }
    } else {
    
        try {
            drawTileSpecific(tileSetName, tileNumber, dx,dy, opacity);
        } catch(error) {
            debugEchoLfps('[drawTile] Error drawing tile "<b>' + tileNumber + '</b>" from tileSet "<b>' + tileSetName + '</b>" to coordinates (<b>' + dx + '</b>,<b>' + dy + '</b>)');
        }
    }

}

/**
 *Draw a single specific tile from a specific tileset to the canvas
 *@param string    tileSetName  The name of the tileset to get the tile out of 
 *@param integer   tileNumber  The number of the tile in the tileset
 *@param float     dx          The destination X-coördinate
 *@param float     dy          The destination Y-coördinate
 *@param float     opacity     A number between 0 and 1 (can be 0 and 1)
 *                             Does nothing currently, as canvas does not
 *                             support adjusting the opacity of images.
 */
function drawTileSpecific(tileSetName, tileNumber, dx, dy, opacity, tilesPerRow, tileWidth, tileHeight, addUserCoordinates) {
    
    // This adds the user coördinates to the dx & dy variable. Which isn't actually useful...
    if(addUserCoordinates) {
        dx = dx + (userPosition.x * defaultTileWidth);
        dy = dy + (userPosition.y * defaultTileHeight);
    }

    // Temporary located here: adjusting the dy parameter
    dy = dy - parseInt(tileSet[tileSetName]['tileHeight']);

    // Fetch the tilesPerRow from the tileset array
    if(!tilesPerRow){
        tilesPerRow = tileSet[tileSetName]['tpr'];
    }
    
    // Fetch the width of a tile
    if(!tileWidth){
        tileWidth = tileSet[tileSetName]['tileWidth'];
    }

    // Fetch the height of a tile
    if(!tileHeight){
        tileHeight = tileSet[tileSetName]['tileHeight'];
    }

    // Set opacity to 1 if it's undefined
    if(!opacity) opacity = 1;

    //End the function if no tileNumber is given
    if (!tileNumber) return;
    
    // Calculate this tileNumber's source x parameter (sx) on the tileset
    var sx = (Math.floor((tileNumber - 1) % tilesPerRow) * tileWidth);
    
    // Calculate this tileNumber's source y parameter (sy) on the tileset
    var sy = (Math.floor((tileNumber - 1) / tilesPerRow) * tileHeight);
    
    try {
        // Draw the tile on the canvas
        ctx.drawImage(tileSet[tileSetName]["image"], sx, sy, tileWidth, tileHeight, dx, dy, tileWidth, tileHeight);
    } catch (error) {
        debugEchoLfps('[drawTileSpecific] Error: ' + error.code + ' - ' +
                      error.message + '<br/>'+
                      'Error drawing tilenumber <b>' + tileNumber + '</b> from tileSet <b>' + tileSetName + '</b> ' +
                      'from coordinates (' + sx + ',' + sy + ') to (' + dx + ',' + dy + ') with tpr: ' + tilesPerRow + ' - tileWidth: ' + tileWidth +
                      ' - tileHeight: ' + tileHeight);
    }
}

/**
 *Get the corresponding tile for a piece of a layer
 *@param mapname    {string}   The name of the map
 *@param layername  {string}    The name of the layer in that map
 *@param x          {int}       The X-row
 *@param y          {int}       The Y-row
 *@returns          {int}       The tile number
 */
function getLayerTile(mapname, layername, x, y) {
    return maps[mapname]['layers'][layername]['data'][y * maps[mapname]['width'] + x];
}

/**
 *Get the info of a tileset knowing only the map it's from and a tilenumber it has
 *@param mapname    {string}    The name of the map
 *@param tilenumer  {int}       The number of the tile in the tileset
 */
function getTileSetInfo(sourceMap, tileNumber){
    
    try{
        // Loop through all the tilesets in this map to determine which one we need
        for (var name in maps[sourceMap]['tilesets']){
            
            // Save the starting tile
            var tileStart = tileSet[name]['firstgid'] - 1;
            
            // Calculate untill what tile we can find in here
            var tileLimit = tileSet[name]['total'] + tileStart;
            
            if(tileNumber >= tileStart && tileNumber <= tileLimit) {
                //Return everything but the image
                return {
                    'tileSetName': name,
                    'tileWidth': tileSet[name]['tileWidth'],
                    'tileHeight': tileSet[name]['tileHeight'],
                    'tpr': tileSet[name]['tpr'],
                    'tpc': tileSet[name]['tpc'],
                    'total': tileSet[name]['total'],
                    'firstgid': tileSet[name]['firstgid']
                };
            }
        };
    } catch(error){
        debugEcho('[getTileSetInfo] Had an error fetching "' + sourceMap + ', tileNumber: ' + tileNumber + ' -- ' + error);
    }
}

/**
 *Change the sprite of a moving object
 *@param objectId           {string}    The Id of the object to change
 *@param movementDirection  {string}    The direction this object has to face
*/
function changeMovingObjectSprite(objectId, movementDirection){
    
        //Change the sprite of every layer if there is one specified for this move
        for (var spriteNr = 0; spriteNr < animatedObjects[objectId]['sprites'].length; spriteNr++){

            // We know the map and the tilenumber, but not the tilesetname.
            // Look that up using our getTileSetInfo function.
            tileSetInfo = new getTileSetInfo(defaultSprites, animatedObjects[objectId]['sprites'][spriteNr]);
            tileSetName = tileSetInfo['tileSetName'];
            tileSetCorrectGid = tileSetInfo['firstgid'] - 1; // Yes, we have to correct for tileset gids again.

            // Check if this object has a sprite for this movement
           if(tileProperties[tileSetName][animatedObjects[objectId]['sprites'][spriteNr]][movementDirection] !== undefined){
               debugEchoLfps('Object <b>' + objectId + '</b> has a sprite for this direction: ' + movementDirection + ' on layer ' + spriteNr);
                
                // Now set it AANDD don't forget to modify for the tileset firstgid.
                animatedObjects[objectId]['spritesToDraw'][spriteNr] = parseInt(tileProperties[tileSetName][animatedObjects[objectId]['sprites'][spriteNr]][movementDirection])+tileSetCorrectGid;
            }
        };
}

/**
 * Draw the testpath variable
 */
function drawTestPath(){

    // Loop through the testPath array
    for(var node = 0; node < testPath.length; node++){

        // Calculate coordinates
        var objX = (((canvasWidth - maps[userPosition.map]['tileWidth']) / 2) - (Math.floor(animatedObjects[userPosition.uid]['x']) * maps[animatedObjects[userPosition.uid]['map']]['tileWidth'])) + (testPath[node]['x'] * maps[animatedObjects[userPosition.uid]['map']]['tileWidth']) - mappOffsetX;
        var objY = (((canvasWidth - maps[userPosition.map]['tileHeight']) / 2) - (Math.floor(animatedObjects[userPosition.uid]['y']) * maps[animatedObjects[userPosition.uid]['map']]['tileHeight'])) + (testPath[node]['y'] * maps[animatedObjects[userPosition.uid]['map']]['tileHeight']) - mappOffsetY;


        // Draw tile 309 (hardcoded, I know. It's in the grassland tileset
        drawTile(279, objX, objY);

    }

}