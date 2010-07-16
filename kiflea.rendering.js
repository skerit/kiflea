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
    
    // Start the fake ms counter
    msfTimer = (new Date()).getTime();
    
    // Clear the canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Adjust the user's x position if the current position
    // does not equal our destination.
    if(userPosition.x != userPosition.moveToX){
        
        // How much time has past since we started this move?
        userPosition.msMoved = now() - userPosition.lastMoved;
        
        // Our progress in this move (between 0 and 1)
        var userMoveProgress = userPosition.msMoved/userMoveMsPerTile;
        
        debugMove('userMoveProgress: ' + userMoveProgress, false);
        
        // If we've spent too much time on this move
        // or we're within ms of reaching our goal: finish it.
        if(userPosition.msMoved >= (userMoveMsPerTile - 10)){
            userPosition.x = userPosition.moveToX;
            userPosition.fromX = userPosition.x;
        } else { // Else calculate our current position
            
            debugMove('<b>From ' + userPosition.fromX + ' to ' + userPosition.moveToX);
            debugMove('Moving X: ' + userPosition.x + ' to ... ');
            
            userPosition.x = userPosition.fromX + ((userPosition.moveToX - userPosition.fromX)*userMoveProgress);
        }
        
        debugMove('New X: ' + userPosition.x);
        
    }
    
    // Adjust the user's y position if the current position
    // does not equal our destination.
    if(userPosition.y != userPosition.moveToY){
        
        // How much time has past since we started this move?
        userPosition.msMoved = now() - userPosition.lastMoved;
        
        // Our progress in this move (between 0 and 1)
        var userMoveProgress = userPosition.msMoved/userMoveMsPerTile;
        
        debugMove('userMoveProgress: ' + userMoveProgress, false);
        
        // If we've spent too much time on this move
        // or we're within ms of reaching our goal: finish it.
        if(userPosition.msMoved >= (userMoveMsPerTile - 10)){
            userPosition.y = userPosition.moveToY;
            userPosition.fromY = userPosition.y;
        } else { // Else calculate our current position
            
            debugMove('<b>From ' + userPosition.fromY + ' to ' + userPosition.moveToY);
            debugMove('Moving Y: ' + userPosition.y + ' to ... ');
            
            userPosition.y = userPosition.fromY + ((userPosition.moveToY - userPosition.fromY)*userMoveProgress);
        }
        
        debugMove('New Y: ' + userPosition.y);
        
    }
    
    // Calculate the "mapOffset" of the user if we're moving when the map is drawn
    // This has to be floored, because pixels can't have a decimal value
    // And this would create 1 pixel spacing between the tiles.
    var mappOffsetX = Math.floor((32 * decimal(userPosition.x)));
    var mappOffsetY = Math.floor((32 * decimal(userPosition.y)));
    
    if(mappOffsetX > 0 || mappOffsetY > 0){
        debugMove('mapOffsetX: ' + mappOffsetX + ' - mapOffsetY: ' + mappOffsetY);
    }

    // Loop through the layers and render them
    $.each(maps[userPosition.map]['layers'], function(layerName, layerContent) {

        // For every visible row
        for (var tileY = 0; tileY <= visibleTilesY+drawExtras; tileY++) {
            
            // And for every tile in that row
            for (var tileX = (0-drawExtras); tileX <= visibleTilesX; tileX++) {
                
                //debugEchoLfps('Loop again');
                
                // Calculate the coördinates of the tile we need, based on our current position
                // (Example: The tile in row 10, column 5)
                var rowTile = userPosition.x + (tileX + (Math.floor(visibleTilesX / 2)) + 1) - visibleTilesX;
                var colTile = userPosition.y + (tileY + (Math.floor(visibleTilesY / 2)) + 1) - visibleTilesY;
                
                // Now that we know what piece of the map we need
                // we need to get the corresponding tileset image
                var tileNumber = getLayerTile(userPosition.map, layerName, Math.floor(rowTile), Math.floor(colTile));
                
                // When we get to an empty tile we can skip towars the next loop
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
        // We draw the users on top of this.
        if(maps[userPosition.map]['layers'][layerName]['properties']['drawUsers']==1){
            drawTileSpecific('npcs', userPosition.currentSprite, (canvasWidth - defaultTileWidth) / 2, (canvasHeight - 48) / 2)
            drawTile(userPosition.currentSprite, (canvasWidth - defaultTileWidth) / 2, (canvasHeight - 48) / 2);
        }
    });
    
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
    
    if(debugOn==true) debug('Fake ms: ' + msf.toPrecision(4) + ' - Real ms: ' + msr.toPrecision(4)  + ' - Fake fps: ' + Math.round(fpsf).toPrecision(3) + ' - Real fps: ' + Math.round(fpsr).toPrecision(3) );

    if(debugGrid == true) {
        // For every row, do this:
        for(var row = 0; row < (canvasWidth/debugGridX); row++ ){
            ctx.beginPath();
            ctx.moveTo(0, row*debugGridX);  
            ctx.lineTo(canvasWidth, row*debugGridX);
            ctx.stroke();
        }
        
        for(var col = 0; col < (canvasWidth/debugGridY); col++ ){
            ctx.beginPath();
            ctx.moveTo(col*debugGridY, 0);  
            ctx.lineTo(col*debugGridY, canvasHeight);
            ctx.stroke();
        }
    }

    // Start the real fps counter
    msrTimer = now();
}

/**
 *Draw an animated tile
 *@param integer   tileNumber  The number of the tile in the tileset
 *@param float     dx          The destination X-coördinate
 *@param float     dy          The destination Y-coördinate
 *@param float     opacity     A number between 0 and 1 (can be 0 and 1)
 *                             Does nothing currently, as canvas does not
 *                             support adjusting the opacity of images.
 */
function drawAnimated(tileSetName, tileNumber, dx,dy, opacity){
    
    // Check if this tile already exists in the array
    if(animatedTiles[tileSetName][tileNumber] === undefined){
        
        debugEchoLfps('Initiate new animated tile: ' + tileNumber);
        
        animatedTiles[tileSetName][tileNumber] = {
            "played": 0,
            "framessince": 0,
            "fps": tileProperties[tileSetName][tileNumber]['fps'],
            "replay": tileProperties[tileSetName][tileNumber]['replay'],
            "currentframe": tileNumber,
            "nextframe": tileProperties[tileSetName][tileNumber]['nextframe']
        };
        
    } else {
        // If the currentframe is zero it means this animation is over!
        if(animatedTiles[tileSetName][tileNumber]["currentframe"] == 0){
            return;
        } else { //If the animation isn't done, load some variables!
            var currentFrame = animatedTiles[tileSetName][tileNumber]["currentframe"];
        }
    }
    
    debugEchoLfps('Going to draw animated tile "<b>' + animatedTiles[tileSetName][tileNumber]['currentframe'] + '</b>"!');
    
        try {
        // Draw the current frame
        drawTileSpecific(
                         tileSetName,                                           // The name of the tileset
                         animatedTiles[tileSetName][tileNumber]['currentframe'],  // The number of the tile
                         dx,         // The destination x position
                         dy          // The destination y position
                         );
        
        debugEchoLfps('Animated tile "<b>' + animatedTiles[tileSetName][tileNumber]['currentframe'] + '</b>" has been drawn');
        
        } catch(error) {
            debugEchoLfps('[drawAnimated] Error drawing <b>animated</b> tile "<b>' + animatedTiles[tileSetName][tileNumber]['currentframe'] + '</b>" from tileSet "<b>' + tileSetName + '</b>" to coordinates (<b>' + dx + '</b>,<b>' + dy + '</b>)'
            );
        }
        
        // The entire world has shown a frame
        animatedTiles[tileSetName][tileNumber]["framessince"]++;
        
        // Count the ammount of frames that need to pass before showing the next one
        frameWait = (fpsr / animatedTiles[tileSetName][tileNumber]["fps"]);
        
        // If there have been more frames then we should wait ...
        if(animatedTiles[tileSetName][tileNumber]["framessince"] >= frameWait){
            
            debugEchoLfps('Nextframe! From "<b>' + animatedTiles[tileSetName][tileNumber]['currentframe'] + '</b>" to "<b>' + animatedTiles[tileSetName][tileNumber]["nextframe"] + '</b>"');
            
            // This animation is ready for the next frame!
            animatedTiles[tileSetName][tileNumber]["currentframe"] = animatedTiles[tileSetName][tileNumber]["nextframe"];
            
            animatedTiles[tileSetName][tileNumber]["framessince"] = 0; // Reset the framessince
            
            // If there is no new nextframe, end or loop back
            if(animatedTiles[tileSetName][tileNumber]["nextframe"] === undefined){
                
                animatedTiles[tileSetName][tileNumber]["played"]++;        // Add a play to the counter
                
                // If the animation is done we have to reset or remove it
                if(animatedTiles[tileSetName][tileNumber]["replay"] != 1){
                    
                    // If the animation is bigger than zero (and one, as seen above) decrease the counter
                    if(animatedTiles[tileSetName][tileNumber]["replay"]>0) animatedTiles[tileSetName][tileNumber]["replay"]--;
                } else{
                    // Setting the currentframe to zero will stop the animation the next time
                    animatedTiles[tileSetName][tileNumber]["currentframe"] = 0;
                }
                
                animatedTiles[tileSetName][tileNumber]["framessince"] = 0; // Reset the framessince
                
            }else { // If there IS a nextframe, set it!
                
                var tempNextFrame = tileProperties[tileSetName][currentFrame]['nextframe'];
                
                // Set the new nextframe: back to the beginning or end it all?
                animatedTiles[tileSetName][tileNumber]['currentframe'] = tempNextFrame;
                
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
 */
function drawTile(tileNumber, dx, dy, opacity) {
    
    // The name of the tileset we will pass on
    var tileSetName;
    var tileSetTpr;
    
    $.each(maps[userPosition.map]['tilesets'], function(key, value) {
        
        // Save the starting tile
        var tileStart = tileSet[key]['firstgid'] - 1;
        
        // Calculate untill what tile we can find in here
        var tileLimit = tileSet[key]['total'] + tileStart;
        
        if(tileNumber > tileStart && tileNumber < tileLimit) {
            tileSetName = key;
            tileSetTpr = tileSet[key]['tpr'];
        }
        
    });

    if(tileProperties[tileSetName][tileNumber] != undefined && tileProperties[tileSetName][tileNumber]['beginanimation'] != undefined){
        try {
            drawAnimated(tileSetName, tileNumber, dx,dy, opacity);
        } catch(error) {
            debugEchoLfps('[drawTile] Error drawing <b>animated</b> tile "<b>' + tileNumber + '</b>" from tileSet "<b>' + tileSetName + '</b>" to coordinates (<b>' + dx + '</b>,<b>' + dy + '</b>)'
            );
        }
    } else {
    
        try {
            drawTileSpecific(tileSetName, tileNumber, dx,dy, opacity);
        } catch(error) {
            debugEchoLfps('[drawTile] Error drawing tile "<b>' + tileNumber + '</b>" from tileSet "<b>' + tileSetName + '</b>" to coordinates (<b>' + dx + '</b>,<b>' + dy + '</b>)'
            );
        }
    }

}

/**
 *Draw a specific tile to the canvas
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
    tileNumber = tileNumber - (maps[userPosition.map]['tilesets'][tileSetName]['firstgid']-1);
    
    // Calculate this tileNumber's source x parameter (sx) on the tileset
    var sx = (Math.floor((tileNumber - 1) % tilesPerRow) * tileWidth);
    
    // Calculate this tileNumber's source y parameter (sy) on the tileset
    var sy = (Math.floor((tileNumber - 1) / tilesPerRow) * tileHeight);
    
    try {
        // Draw the tile on the canvas
        ctx.drawImage(tileSet[tileSetName]["image"], sx, sy, tileWidth, tileHeight, dx, dy, tileWidth, tileHeight);
    } catch (error) {
        debugEchoLfps(error.code + ' - ' + error.message + ' - TPR: ' + tilesPerRow + ' - Width: ' + tileWidth + ' - Height: ' + tileHeight);
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
