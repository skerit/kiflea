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
        
    }

    // Start the fake ms counter
    msfTimer = (new Date()).getTime();
    
    // Clear the canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Every object has to be moved gradually. We have to do this now already,
    // because otherwise we'd get jittering. Especially true for our own user.
    // Unfortunately, other moving objects have a very slight jitter if you're
    // also moving.
    for (var objectId in animatedObjects){
            // If the object needs to be moved, do it smoothly
            slideMovingObject(objectId);
    }
    
    // Calculate the "mapOffset" of the user if we're moving when the map is drawn
    // This has to be floored, because pixels can't have a decimal value
    // And this would create 1 pixel spacing between the tiles while moving.
    var mappOffsetX = Math.floor((32 * decimal(animatedObjects[userPosition.uid]['x'])));
    var mappOffsetY = Math.floor((32 * decimal(animatedObjects[userPosition.uid]['y'])));
    
    if(mappOffsetX > 0 || mappOffsetY > 0){
        debugMove('mapOffsetX: ' + mappOffsetX + ' - mapOffsetY: ' + mappOffsetY);
    }

    // Loop through the layers and render them
    for(var layerName in maps[userPosition.map]['layers']) {

        // For every visible row (+ the drawExtras row, needed for tiles that are bigger than the default map tile)
        for (var tileY = 0; tileY <= visibleTilesY+drawExtras; tileY++) {
            
            // And for every tile in that row (+ the drawExtras)
            for (var tileX = (0-drawExtras); tileX <= visibleTilesX; tileX++) {
                
                // Calculate the coördinates of the tile we need, based on our current position
                // (Example: The tile in row 10, column 5)
                var rowTile = animatedObjects[userPosition.uid]['x'] + (tileX + (Math.floor(visibleTilesX / 2)) + 1) - visibleTilesX;
                var colTile = animatedObjects[userPosition.uid]['y'] + (tileY + (Math.floor(visibleTilesY / 2)) + 1) - visibleTilesY;
                
                // Now that we know what piece of the map we need
                // we need to get the corresponding tileset image
                var tileNumber = getLayerTile(userPosition.map, layerName, Math.floor(rowTile), Math.floor(colTile));
                
                // When we get to an empty tile we can skip towards the next loop
                if(tileNumber == 0 || tileNumber === undefined) continue;

                // Now calculate where to draw this tile
                var destinationX = (tileX * (32)) - mappOffsetX;
                var destinationY = (tileY * (32)) - mappOffsetY;
                
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

        // If this layer has the "drawUsers" property set to "1"
        // We draw all the objects on top of it.
        if(maps[userPosition.map]['layers'][layerName]['properties']['drawUsers']==1){
            //drawTile(userPosition.currentSprite, (canvasWidth - defaultTileWidth) / 2, (canvasHeight - 48) / 2);
            
            // Loop through every object
            for (var objectId in animatedObjects){
                
                debugEchoLfps('Found object ' + objectId);
                
                // If this is our own user, set the coordinates at the center of the screen.
                if(objectId == userPosition.uid) {
                    debugEchoLfps('This object is our own user ' + objectId);
                    var objX = (canvasWidth - defaultTileWidth) / 2;
                    var objY = (canvasHeight - defaultTileWidth) / 2;
                } else {
                    var objX = (((canvasWidth - defaultTileWidth) / 2) - (Math.floor(animatedObjects[userPosition.uid]['x']) * 32)) + (animatedObjects[objectId]['x'] * 32) - mappOffsetX;
                    var objY = (((canvasWidth - defaultTileWidth) / 2) - (Math.floor(animatedObjects[userPosition.uid]['y']) * 32)) + (animatedObjects[objectId]['y'] * 32) - mappOffsetY;
                }
                // Loop through all the layers of this object
                for (var spriteNr = 0; spriteNr < animatedObjects[objectId]['spritesToDraw'].length; spriteNr++){
                    
                    debugEchoLfps('Drawing object ' + objectId + ' layer nr ' + spriteNr + ' - namely: ' + animatedObjects[objectId]['spritesToDraw'][spriteNr] );
                    
                    drawTile(animatedObjects[objectId]['spritesToDraw'][spriteNr], objX, objY, null, objectId);
                }
                
                
            }
        }
    };
    
    debugEchoLfps('Finished the layers');
    
    // Render animations:
    for (var i = 0; i < animation.length; i++){

        // Draw the current frame
        drawTileSpecific(
                         animation[i]["name"],      // The name of the tileset
                         animation[i]["played"]+1,  // The number of the tile
                         animation[i]["x"],         // The destination x position
                         animation[i]["y"]          // The destination y position
                         )
        
        // The entire world has shown a frame
        animation[i]["framessince"]++
        
        // Count the ammount of frames that need to pass before showing the next one
        frameWait = (fpsr / animation[i]["fps"])
        
        if(animation[i]["framessince"] >= frameWait){
            // This animation is ready for the next frame!
            animation[i]["played"]++;
            animation[i]["framessince"] = 0;
        }
        
        // If the animation is done we have to reset or remove it
        if(animation[i]["played"] == animation[i]["frames"]) {
            if(animation[i]["replay"] != 1) {
                animation[i]["played"] = 0;
                if(animation[i]["replay"]>0) animation[i]["replay"]--
            } else {
                animation.splice(i, 1)
            }
        }
    }

    // Calculate fake ms & fps (time it took to draw this loop)
    msf = (now() - msfTimer);
    fpsf = (1000/msf);
    
    // Calculate real ms & fps (time it took to draw this loop + gap between loop)
    msr = (now() - msrTimer);
    fpsr = (1000/msr);
    
    // Draw a grid over the screen.
    if(debugGrid == true) {
        
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

    // Clear the sameFrame variable, used by animated tiles
    sameFrame = {};

    // Start the real fps counter
    msrTimer = now();
    
    // Draw the HUD
    drawHud();
    
    // If we've enabled debugging, we actually want the fps (bad name, I know)
    // Draw it on the canvas for better framerates
    if(debugOn==true){
        ctx.fillStyle = "rgba(20, 20, 20, 0.7)";  
        ctx.fillRect (2, canvasHeight-33, canvasWidth-4, 20);
        ctx.strokeStyle = "white";  
        ctx.font = "12px monospace";
        ctx.strokeText('Fake ms: ' + msf.toPrecision(4) + ' - Real ms: ' + msr.toPrecision(4)  + ' - Fake fps: ' + Math.round(fpsf).toPrecision(3) + ' - Real fps: ' + Math.round(fpsr).toPrecision(3), 5, canvasHeight-20);
    };
    
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
 *Draw the HUD
 */
function drawHud(){
   
   // Loop through the layers
   for(var layer = 0; layer < hudLayers['layers'].length; layer++){
    
        // Variables for our destination
        var hudOrientation = hudLayers['layers'][layer]['orientation'];
        var dx;
        var dy;
        var dwidth = hudLayers['layers'][layer]['width'];
        var dheight = hudLayers['layers'][layer]['height'];
        var tileSetName = hudLayers['layers'][layer]['tileset'];
        var sx = hudLayers['layers'][layer]['sx'];
        var sy = hudLayers['layers'][layer]['sy'];
        
        // Now where to draw the hud? Look at the orientation.
        switch(hudOrientation){

            case 'topright':
                dx = canvasWidth - hudLayers['layers'][layer]['dx'] - dwidth;
                dy = hudLayers['layers'][layer]['dy'];
                break;

            case 'topleft':
                dx = hudLayers['layers'][layer]['dx'];
                dy = hudLayers['layers'][layer]['dy'];
                break;

            case 'bottomright':
                dx = canvasWidth - hudLayers['layers'][layer]['dx'] - dwidth;
                dy = canvasHeight - hudLayers['layers'][layer]['dy'] - dheight;
                break;

            case 'bottomleft':
                dx = hudLayers['layers'][layer]['dx'];
                dy = canvasHeight - hudLayers['layers'][layer]['dy'] - dheight;
                break;
        }
        
        if(hudLayers['layers'][layer]['widthdepend'] !== undefined){
            // This needs to be refined, of course. but let's just test it for now.
            // The width of this item depends on our health.
            dwidth = (animatedObjects[userPosition.uid]['health']/animatedObjects[userPosition.uid]['fullhealth']) * dwidth;
        }
        
        debugHud('Drawhud from ' + tileSet[tileSetName]['image'] + ' (' + sx + ',' + sy + ',' + dwidth + ',' + dheight + ') to (' +dx + ',' + dy + ',' + dwidth + ',' + dheight + ')');
        ctx.drawImage(tileSet[tileSetName]['image'], sx, sy, dwidth, dheight, dx, dy, dwidth, dheight);
    
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
 *@param integer   tileNumberOnMap
 *@param string    objectId    If it's an object, give its ID.
 */
function drawAnimated(tileSetName, tileNumber, dx,dy, opacity, tileNumberOnMap, objectId){
    
    // World-animated tiles are identified by their tilenumber (so every instance
    // of one of these tiles has the same ID in the animation. That's what we want)
    // Object-animated tiles are identified by their objectId.
    // We need something to store one or the other in
    var animationId;
    
    // Now let's decide which one it is
    if(objectId === undefined) {
        animationId = tileNumberOnMap;
    } else {
        animationId = objectId;
        debugEcho('is object!');
    }
    
    // Check if this tile already exists in the array
    if(animatedTiles[tileSetName][animationId] === undefined){
        
        debugEchoLfps('Initiate new animated tile: ' + animationId);
        
        animatedTiles[tileSetName][animationId] = {
            "played": 0,
            "framessince": 0,
            "fps": tileProperties[tileSetName][animationId]['fps'],
            "replay": tileProperties[tileSetName][animationId]['replay'],
            "currentframe": tileNumberOnMap,
            "nextframe": tileProperties[tileSetName][animationId]['nextframe']
        };
        
    } else { // This isn't a new animation. We're continuing...
        // If the currentframe is zero it means this animation is over!
        if(animatedTiles[tileSetName][animationId]["currentframe"] == 0){
            return;
        } else { //If the animation isn't done, load some variables!
            // Nothing needs to be done
        }
    }
    
    // Create a variable to hold our currentFrame (as to not duplicate code
    var currentFrame = animatedTiles[tileSetName][animationId]["currentframe"];
    
    debugEchoLfps('Going to draw animated tile "<b>' + animatedTiles[tileSetName][animationId]['currentframe'] + '</b>"!');
    
    // We used to adjust tilenumber with their firstgid in drawTileSpecific, but that didn't make drawTileSpecific very specific.
    // Now we put one in drawTile and drawTileAnimated. Ideally we would stop using the tileNumberOnMap for tileproperties, but
    // hey, this works.
    var adjustedFrame = animatedTiles[tileSetName][animationId]['currentframe'] - (tileSet[tileSetName]['firstgid']-1);
    
        try {
        // Draw the current frame
        drawTileSpecific(
                         tileSetName,                                           // The name of the tileset
                         adjustedFrame,  // The number of the tile
                         dx,         // The destination x position
                         dy          // The destination y position
                         );
        
        debugEchoLfps('Animated tile "<b>' + animatedTiles[tileSetName][animationId]['currentframe'] + '</b>" has been drawn');
        
        } catch(error) {
            debugEchoLfps('[drawAnimated] Error drawing <b>animated</b> tile "<b>' + animatedTiles[tileSetName][animationId]['currentframe'] + '</b>" from tileSet "<b>' + tileSetName + '</b>" to coordinates (<b>' + dx + '</b>,<b>' + dy + '</b>)'
            );
        }
        
        // If this is a world-animated tile we're going to check if this is a new frame being drawn
        // We need to make sure this object exists before we assign a value in it
        // This array is emptied at the end of every frame
        if(sameFrame[tileSetName] === undefined && objectId === undefined) {
            // Initiate this tileset in the sameFrame array   
            sameFrame[tileSetName] = {};
        }
        
        if(sameFrame[tileSetName][tileNumberOnMap] === undefined && objectId === undefined) {
            
            // Make sure we've already created this tileSetName in the array before doing the next write
            if(sameFrame[tileSetName] === undefined) sameFrame[tileSetName] = {};
            
            // Say that the current tile has already been drawn this frame.
            // This will prevent the framessince counter from being increased
            // if this same tile is on the map multiple times.
            // Without this the framerate would double if there were 2 of these.
            sameFrame[tileSetName][tileNumberOnMap] = true;
            
            // Add a frame to the counter
            animatedTiles[tileSetName][animationId]["framessince"]++;
        }
        
        // Count the ammount of frames that need to pass before showing the next one
        frameWait = (fpsr / animatedTiles[tileSetName][animationId]["fps"]);
        
        // If there have been more frames then we should wait ...
        if(animatedTiles[tileSetName][animationId]["framessince"] >= frameWait){
            
            debugEchoLfps('Nextframe! From "<b>' + animatedTiles[tileSetName][animationId]['currentframe'] + '</b>" to "<b>' + animatedTiles[tileSetName][animationId]["nextframe"] + '</b>"');
            debugEchoLfps('<pre>' + dump(animatedTiles[tileSetName][animationId]) + '</pre>');
            
            // This animation is ready for the next frame!
            animatedTiles[tileSetName][animationId]["currentframe"] = animatedTiles[tileSetName][animationId]["nextframe"];
            
            animatedTiles[tileSetName][animationId]["framessince"] = 0; // Reset the framessince
            
            // If there is no new nextframe, end or loop back
            if(animatedTiles[tileSetName][animationId]["nextframe"] === undefined){
                
                animatedTiles[tileSetName][animationId]["played"]++;        // Add a play to the counter
                
                // If the animation is done we have to reset or remove it
                if(animatedTiles[tileSetName][animationId]["replay"] != 1){
                    
                    // If the animation is bigger than zero (and one, as seen above) decrease the counter
                    if(animatedTiles[tileSetName][animationId]["replay"]>0) animatedTiles[tileSetName][animationId]["replay"]--;
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
 */
function drawTile(tileNumber, dx, dy, opacity, objectId) {
    
    // The name of the tileset we will pass on
    var tileSetName;
    var tileSetTpr;
    var sourceMap;  // From which map do we have to fetch the tilesets?
    
    // If this isn't an object the sourcemap is the current map we're on
    if(objectId === undefined) {
        sourceMap = userPosition.map;
    }else {
        // If it is an object we have to get the tilesets from the default "map". Hackish, but it works
        sourceMap = defaultSprites;
        
        // We also have to determine if the object is moving.
        if(animatedObjects[objectId]['moveToX'] != animatedObjects[objectId]['x'] || animatedObjects[objectId]['moveToY'] != animatedObjects[objectId]['y']){
            var movingObject = true; // Is this object moving?
            //debugEcho('Moving object!');
        }
    }
    
    // We know the map and the tilenumber, but not the tilesetname.
    // Look that up using our getTileSetInfo function.
    tileSetInfo = new getTileSetInfo(sourceMap, tileNumber);
    tileSetName = tileSetInfo['tileSetName'];
    tileSetTpr = tileSetInfo['tpr'];
    
    // We're going to fix the tileNumber next (to get the right tilenumber of the
    // map, not the tileset) But in the tileProperties object they are still stored
    // by their map tilenumber, which is logical.
    var tileNumberOnMap = tileNumber;

    // tileNumbers are fixed per MAP, not per tileset.(So a second tileset in a
    // map wouldn't start from 1 but from 21, for example.)
    // We still need to know which piece to get from the tileset, so this fixes that
    tileNumber = tileNumber - (maps[sourceMap]['tilesets'][tileSetName]['firstgid']-1);

    if(tileProperties[tileSetName][tileNumberOnMap] != undefined &&
       (tileProperties[tileSetName][tileNumberOnMap]['beginanimation'] != undefined || movingObject == true)){
        try {
            drawAnimated(tileSetName, tileNumber, dx,dy, opacity, tileNumberOnMap);
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
 * When an object is moved, it happens gradually. Smoothly.
 * This function checks if the object needs to be moved and
 * makes sure that happens smoothly.
 * This now also changes the sprite to draw on movement
 * @param   objectId    {string}    The ID of the object
 */
function slideMovingObject(objectId){
    
    // Adjust the object's x position if the current position does not equal its destination.
    if(animatedObjects[objectId]['x'] != animatedObjects[objectId]['moveToX']){
        
        // How much time has past since we started this move?
        animatedObjects[objectId]['msMoved'] = now() - animatedObjects[objectId]['lastMoved'];
        
        // Calculate how many tiles we have to move
        var moveAmmount = (animatedObjects[objectId]['moveToX'] - animatedObjects[objectId]['fromX']);

        // Detect the direction of the move (left or right)
        if(moveAmmount>0){
            // Move to the right
            var movementDirection = 'righttile';
        } else {
            var movementDirection = 'lefttile';
        }
        
        // Change the direction of the tile with our function
        // This has to happen wheter the tile is walkable or not
        changeMovingObjectSprite(objectId, movementDirection);
        
        // Check if our wanted destination is actually walkable. If it isn't, revert.
        if(isTileWalkable(userPosition.map,animatedObjects[userPosition.uid]['moveToX'], animatedObjects[userPosition.uid]['moveToY']) == false){
            animatedObjects[userPosition.uid]['moveToX'] = animatedObjects[userPosition.uid]['fromX'];
        } else { // If it is walkable, actually move
            // Our progress in this move (between 0 and 1)
            var objectMoveProgress = animatedObjects[objectId]['msMoved']/(userMoveMsPerTile*Math.abs(moveAmmount));
            
            debugMove('Object <b>' + objectId + '</b> has to move <b>' + moveAmmount + ' tiles, moving progress (X): ' + objectMoveProgress, false);
            
            // If we've spent too much time on this move
            // or we're within ms of reaching our goal: finish it.
            if(animatedObjects[objectId]['msMoved'] >= (userMoveMsPerTile*Math.abs(moveAmmount))){
                animatedObjects[objectId]['x'] = animatedObjects[objectId]['moveToX'];
                animatedObjects[objectId]['fromX'] = animatedObjects[objectId]['x'];
            } else { // Else calculate our current position
                
                debugMove('<b>From ' + animatedObjects[objectId]['fromX'] + ' to ' + animatedObjects[objectId]['moveToX']);
                debugMove('Moving X: ' + animatedObjects[objectId]['x'] + ' to ... ');
                
                animatedObjects[objectId]['x'] = animatedObjects[objectId]['fromX'] + ((animatedObjects[objectId]['moveToX'] - animatedObjects[objectId]['fromX'])*objectMoveProgress);
            }
            
            debugMove('Object ' + objectId + '\'s new X: ' + animatedObjects[objectId]['x']);
        }
        
    }
    
    // Adjust the user's y position if the current position
    // does not equal our destination.
    if(animatedObjects[objectId]['y'] != animatedObjects[objectId]['moveToY']){
        
        // How much time has past since we started this move?
        animatedObjects[objectId]['msMoved'] = now() - animatedObjects[objectId]['lastMoved'];

        // Calculate how many tiles we have to move
        var moveAmmount = (animatedObjects[objectId]['moveToY'] - animatedObjects[objectId]['fromY']);

        // Detect the direction of the move (left or right)
        if((animatedObjects[objectId]['moveToY'] - animatedObjects[objectId]['fromY'])>0){
            // Move down
            var movementDirection = 'downtile';
        } else {
            var movementDirection = 'uptile';
        }
        
        // Change the direction of the tile with our function
        // Has to happen even if the tile isn't walkable
        changeMovingObjectSprite(objectId, movementDirection);

        // Check if our wanted destination is actually walkable. If it isn't, revert.
        if(isTileWalkable(userPosition.map,animatedObjects[userPosition.uid]['moveToX'], animatedObjects[userPosition.uid]['moveToY']) == false){
            animatedObjects[userPosition.uid]['moveToY'] = animatedObjects[userPosition.uid]['fromY'];
        } else { // If it is walkable, actually move
            // Our progress in this move (between 0 and 1)
            var objectMoveProgress = animatedObjects[objectId]['msMoved']/(userMoveMsPerTile*Math.abs(moveAmmount));
            
            debugMove('Object <b>' + objectId + '</b> moving progress (Y): ' + objectMoveProgress, false);
            
            // If we've spent too much time on this move
            // or we're within ms of reaching our goal: finish it.
            if(animatedObjects[objectId]['msMoved'] >= (userMoveMsPerTile*Math.abs(moveAmmount))){
                animatedObjects[objectId]['y'] = animatedObjects[objectId]['moveToY'];
                animatedObjects[objectId]['fromY'] = animatedObjects[objectId]['y'];
            } else { // Else calculate our current position
                
                debugMove('<b>From ' + animatedObjects[objectId]['fromY'] + ' to ' + animatedObjects[objectId]['moveToY']);
                debugMove('Moving Y: ' + animatedObjects[objectId]['y'] + ' to ... ');
                
                animatedObjects[objectId]['y'] = animatedObjects[objectId]['fromY'] + ((animatedObjects[objectId]['moveToY'] - animatedObjects[objectId]['fromY'])*objectMoveProgress);
            }
            
            debugMove('Object ' + objectId + '\'s new Y: ' + animatedObjects[objectId]['y']);
        }
        
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
    
    // Loop through all the tilesets in this map to determine which one we need
    for (var name in maps[sourceMap]['tilesets']){
        
        // Save the starting tile
        var tileStart = tileSet[name]['firstgid'] - 1;
        
        // Calculate untill what tile we can find in here
        var tileLimit = tileSet[name]['total'] + tileStart;
        
        if(tileNumber > tileStart && tileNumber < tileLimit) {
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