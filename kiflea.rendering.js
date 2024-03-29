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
 * Calculate and render a single frame
 */
k.operations.renderFrame = function(){
	
	k.state.debug.rendercount++;
	
	// Prepare the canvas for a render
    k.links.canvas.beginRender();
	
    // Loading screen: wait for maps to load
	if (k.state.load.toload > k.state.load.loaded){
		k.links.canvas.addLoadingMessage("Loading ...");
		k.links.canvas.addLoadingMessage(k.state.load.loaded + " out of " + k.state.load.toload);
	}
	
	// Loading screen: wait for a connection to the server
	if (!k.state.server.connected && k.settings.server.CONNECT){
		k.links.canvas.addLoadingMessage("Connecting ...");
	}
	
	// Loading screen: wait for server initiation
	if (k.state.server.connected && k.settings.server.CONNECT && !k.state.server.initiated){
		k.links.canvas.addLoadingMessage("Connected!");
		k.links.canvas.addLoadingMessage("Waiting for server initiation ...");
	}
	
	// When messages have been added (or for some other reason) the drawWorld
	// variable will be false. Draw the loading messages then.
	// Else: just draw the world
	if(!k.links.canvas.drawWorld || !k.state.load.finished) {
		k.links.canvas.drawLoadingMessages();
	} else {
		
		// Make sure we haven't moved to a different map
		k.links.canvas.prepareMap(k.sel.map.name);
		
		// Simulate autorepeating keyboard presses (arrows)
		k.operations.keyboard.fakePress();
		
		doActionsReceived(); // Do the actions every object has received
		
		// Calculate every objects next xy coordinates
		k.operations.prerenderMoveObjects();
	
		k.operations.render.calculateOffset(); // Calculate the map offset
	
		// Loop through the layers and render them
		for(var layerName in k.sel.map.layers) {
	
			k.operations.renderLayer(layerName); // Render this layer
	
			// If this layer has the "drawUsers" property set to "1"
			// We draw all the objects on top of it.
			if(k.sel.map.layers[layerName]['properties']['drawUsers']==1){
				
				highlightSelectedObject(); // Draw a circle underneath our selection
				
				// If we've enabled pathfinding debug, draw the testpath array
				if(debugPathOn == true) drawTestPath();
	
				//renderObjects(layerName); // Render every object
			}
		};
		
		// Draw user at 7,6 canvas
		/*var uc = k.operations.coord.getByCanvas(7,6);
		k.links.canvas.buffer.fillStyle = "rgba(0, 0, 200, 0.7)";
		k.links.canvas.buffer.fillRect(uc.absX,
							uc.absY,
							k.sel.map.tileWidth,
							k.sel.map.tileHeight);*/
		
		// Clear the buffer, because we probably no longer need it
		k.links.canvas.buffer.clearRect(0, 0, 480, 480);
		k.links.canvas.ctx.clearRect(0, 0, 480, 480);
	}

    // Clear the sameFrame variable, used by animated tiles
    sameFrame = {};

	// Now flush the canvas buffer to the real canvas
	k.links.canvas.flush();
    
	// Indicate we've finished this render
	k.links.canvas.finishedRender();
    
}

/**
 *Get the objectID of the current selection
 *@returns  {string}    The objectId of the current selection
 */
function getSelectedObject(){
    
    if(animatedObjects[userPosition.uid]['selection'] !== undefined) {
        return animatedObjects[userPosition.uid]['selection'];
    } else {
        return '';
    }
}

/**
 *Draw a circle under our selection
 */
function highlightSelectedObject(){
    
    // Draw a little square under our selection if we have one
    if(k.sel.state.selected.length  > 0){
        
        var selectionC = getRealCoordinates(animatedObjects[userPosition.uid]['selection']);
        
        k.links.canvas.ctx.beginPath();
        k.links.canvas.ctx.fillStyle = "rgba(0,0,255,0.3)";
        k.links.canvas.ctx.strokeStyle = "rgba(0,0,0,0.8)";
        k.links.canvas.ctx.arc(selectionC['x']+(k.collections.maps[animatedObjects[userPosition.uid]['map']]['tileWidth']/2),selectionC['y']-(k.collections.maps[animatedObjects[userPosition.uid]['map']]['tileHeight']/2),k.collections.maps[animatedObjects[userPosition.uid]['map']]['tileWidth']/2,0,Math.PI*2,true);
        k.links.canvas.ctx.fill();
        k.links.canvas.ctx.stroke();
        k.links.canvas.ctx.closePath();
    }
}


/**
 *Render the effects of an object
 *@param    objectId    {string}    The object of which to render the effects
 */
function renderEffects(objectId){
return;
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
        
        var coordinates = getRealCoordinates(objectId,x, y);
        
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
            k.operations.render.drawTile(currentSprite, coordinates['x'], coordinates['y'], null, objectId, animatedObjects[objectId]['effects'][effectNr]['id']); // The given id contains the ID, but not yet the tilenumberonmap
        } catch (error){
            debugEcho('Error drawing ' + dText + ' of baseSprite ' + baseSprite + ' namely: ' + currentSprite + ' -- ' + error);
        }
        
        var animationId = objectId + '-' + animatedObjects[objectId]['effects'][effectNr]['id'] + '-' + currentSprite;
        
        try {

            // If we have reached our destination
            if(objectMoveProgressX > 1 && objectMoveProgressY > 1){
                
                // Get the playcount only if it actually is an animation, and it exists.
                // Otherwise it has only 1 frame and has played once.
                if(animatedTiles[baseTilesetInfo['tileSetName']][animationId] !== undefined) {
                    var played = animatedTiles[baseTilesetInfo['tileSetName']][animationId]['played'];
                } else {
                    var played = 1;
                }
                
                // And if we've played the effect one full time OR (it was a moving object OR it has an aftereffect)
                if(played > 0 || ((dx != sx || dy != sy) || animatedObjects[objectId]['effects'][effectNr]['aftereffect'] !== undefined)){
                    
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
 * Render an array of given objects
 * @param	{array}			objects	An array of objectids
 * @param	{k.Types.Sector}	sector
 */
k.operations.render.objects = function(objectIds, sector){

    // Loop through every object
    for (var objectId in objectIds){
		
		var object = k.links.getObject(objectId);
		var map = object.map;
        
        // If this object isn't on the same map as our user,
		// continue to the next object
        if(object.map != k.sel.map) continue;
        
		// Get all the coordinates
		var objC = k.operations.coord.getByMap
				   (object.position.x, object.position.y);
		
        // Loop through all the layers of this object
		for (var sprite in object.state.tiles){
            
			var tile = object.state.tiles[sprite];
			
            if(object.id == k.sel.id){
                debugEchoLfps('Drawing own user ' + object.id + ' layer nr ' +
							  sprite + ' - namely: ' +
							  object.tiles[sprite] );
            }
			
			if(object.id == k.sel.id){
				var objX = objC.absX;
				var objY = objC.absY + map.tileHeight;
			} else {
				var coord = getRealCoordinates(object.id);
				var objX = coord.x;
				var objY = coord.y;
			}
			
			// To draw the tile we need to add the tileheight (which we already
			// did) But to get the coordinates, we need to subtract it again
			//if(k.links.canvas.dirty.get.byAbsolute(objX, objY - map.tileHeight)){

				//k.operations.render.drawTile(tile, objX, objY, object.id);
				k.operations.render.drawTile(tile, objC, sector, object);
				
			//}
        }
        
        // Draw the effects of this user
        //renderEffects(object.id);
    }
}

/**
 * Render a specific layer of our current map
 * @param    layerName   {string}    The name of the layer to draw
 */
k.operations.renderLayer = function(layerName){
	
	var layer = k.links.getLayer(layerName);
	
	/**
	 * Since canvas sectors can differ from map sectors we have to calculate
	 * the map coordinates from the starting position of the canvas
	 */
	var coord = k.operations.coord.getByCanvas(0, 0);
	
	// Get the first possible starter sector tile coordinates
	upX = coord.mapX - (coord.mapX % k.settings.engine.SECTORSIZE);
	upY = coord.mapY - (coord.mapY % k.settings.engine.SECTORSIZE);

	// Go through every map sector
	for (var mapY = upY - k.settings.engine.SECTORSIZE;
		 mapY <= upY + k.links.canvas.tpr + k.settings.engine.SECTORSIZE;
		 mapY += k.settings.engine.SECTORSIZE){
		
		for (var mapX = upX - k.settings.engine.SECTORSIZE;
		 mapX <= upX + k.links.canvas.tpc + k.settings.engine.SECTORSIZE;
		 mapX += k.settings.engine.SECTORSIZE){
			
			// Get the first (upper left) tile of this sector
			var tile = k.links.getTileByMap(mapX, mapY, layerName);

			// If there is no map here, draw black
			if(tile.coord.sec < 0) {
				
				k.links.canvas.buffer.fillStyle = "rgb(0, 0, 0)";
				k.links.canvas.buffer.fillRect(tile.coord.absX,
									tile.coord.absY,
									k.sel.map.tileWidth * k.settings.engine.SECTORSIZE,
									k.sel.map.tileHeight * k.settings.engine.SECTORSIZE);
				
				continue;
			}
			
			// Get the sector at this position
			var sector = k.links.getSector(tile.coord, layer);
			
			if(k.state.engine.mappOffsetX != 0 || k.state.engine.mappOffsetY != 0 || sector.dirty.self.counter > 0){
				
				// Set this sector as dirty for another 3 frames if we're moving
				if(k.state.engine.mappOffsetX != 0 || k.state.engine.mappOffsetY != 0){
					k.links.canvas.dirty.set.sectorFamily(sector, 3);
				}
				
				layer.canvasLayer.ctx.clearRect(tile.coord.absX,
									tile.coord.absY,
									k.sel.map.tileWidth * k.settings.engine.SECTORSIZE,
									k.sel.map.tileHeight * k.settings.engine.SECTORSIZE);
				
				if (sector.dirty.self.empty == false || sector.dirty.self.empty === undefined) {
					// Prepare the sector: redraw tiles if needed
					k.operations.prepareLayerSector(sector);
				
					// Draw the sector onto its own layer
					layer.canvasLayer.ctx.drawImage(sector.element,
													tile.coord.absX - sector.padding,
													tile.coord.absY - sector.padding);
					
					// Increase the sector's drawn counter
					k.state.debug.sectorsDrawn++;
				
				}
				
				k.links.canvas.dirty.set.sector(sector, 0);

				// Draw it to the debug screen if it's selected
				if(k.settings.debug.LAYERS && debugnr == sector.coord.sec) k.debug.drawSector(debugnr);
				
				if(k.state.engine.drawn[sector.map.name] === undefined)
					k.state.engine.drawn[sector.map.name] = {};
				
				if(k.state.engine.drawn[sector.map.name][sector.coord.sec] === undefined)
					k.state.engine.drawn[sector.map.name][sector.coord.sec] = {};
				
				k.state.engine.drawn[sector.map.name][sector.coord.sec][sector.layer.name] = true;
				
				// Reset the sector dirty booleans
				sector.dirty.self.increased = false;
				sector.dirty.self.decreased = false;
				
			}
			
		}
	}
}

des = function(x, y) {

	dc.fillRect(0, 0, 400, 400);
	
	sector = k.links.getSector(k.links.getTileByCanvas(x, y,"Ground")['coord'], k.links.getTileByCanvas(0,0,"Ground")["layer"]);
	dc.drawImage(sector.element, 100, 100);
}

/**
 * Prepare a sector, redraw certain tiles if needed
 * @param    {k.Types.Sector}	sector
 */
k.operations.prepareLayerSector = function(sector){
	
	var sectorDirty = false;
	var sectorEmpty = true; // Does this sector actually contain anything?
	
	// Loop twice through this. One time to clear the dirty tiles, another time to fill them
	// This is needed for objects. There's a break at the end if nothing is dirty
	for(var hasBeenCleared = 0; hasBeenCleared < 2; hasBeenCleared++){
		
		for(var mapY = sector.coord.mapY;
			mapY < sector.coord.mapY + k.settings.engine.SECTORSIZE;
			mapY++){
			
			for(var mapX = sector.coord.mapX;
				mapX < sector.coord.mapX + k.settings.engine.SECTORSIZE;
				mapX++){
				
				var coord = k.operations.coord.getByMap(mapX, mapY, sector.map.name);
				
				var tile = k.links.getTileByCoordSector(coord, sector);
				
				var layer = sector.layer;
				
				// Do we have to do something to this tile?
				if(tile.dirty && tile.properties.draw === undefined){
					
					if(!hasBeenCleared){
						
						// Only 1 tile is needed to turn this sector dirty
						sectorDirty = true;
						
						// If this is the top of the sector, clear that too
						if(coord.secY == 0) {
							sector.ctx.clearRect(coord.secAbsX + sector.padding,
											coord.secAbsY-sector.map.tileHeight,
											sector.map.tileWidth,
											sector.map.tileHeight);
						} else if (coord.secY == k.settings.engine.SECTORSIZE - 1) {
							sector.ctx.clearRect(coord.secAbsX + sector.padding,
											coord.secAbsY+sector.map.tileHeight,
											sector.map.tileWidth,
											sector.map.tileHeight);
						}
						
						if(coord.secX == 0) {
							sector.ctx.clearRect(coord.secAbsX + sector.padding + sector.map.tileWidth,
											coord.secAbsY,
											sector.map.tileWidth,
											sector.map.tileHeight);
						} else if (coord.secX == k.settings.engine.SECTORSIZE - 1) {
							sector.ctx.clearRect(coord.secAbsX + sector.padding + sector.map.tileWidth,
											coord.secAbsY,
											sector.map.tileWidth,
											sector.map.tileHeight);
						}
						
						// Clear the upper right tile
						if(coord.secX == k.settings.engine.SECTORSIZE - 1 && coord.secY == 0) {
							sector.ctx.clearRect(coord.secAbsX + sector.padding + sector.map.tileWidth,
											coord.secAbsY-sector.map.tileHeight,
											sector.map.tileWidth,
											sector.map.tileHeight);
						}
		
						// Clear the tile
						sector.ctx.clearRect(coord.secAbsX + sector.padding,
											coord.secAbsY-sector.map.tileHeight + sector.padding,
											sector.map.tileWidth,
											sector.map.tileHeight);
						
						// Skip to the next clearing iteration
						continue;
					}
					
					// Draw the object first
					if(sector.layer.properties['drawUsers']==1){
						if(k.state.position[k.sel.map.name][tile.coord.lex] !== undefined) {
							k.debug.log('Drawing object to ' + coord.sec + ' on layer ' + sector.layer.name);
							k.operations.render.objects(k.state.position[k.sel.map.name][tile.coord.lex], sector);
						}
					}
					
					if(tile.tilenr >= 0) k.operations.render.drawTile(tile, coord, sector);
					
					k.state.debug.tilesDrawn++;
					
					// Draw shadows
					if(layer.properties['drawShadow']==1){
						if(k.links.canvas.map.shadowTiles[tile.coord.lex] !== undefined){
							
							sector.ctx.fillStyle = "rgba(30, 30, 30, 0.5)";
							sector.ctx.fillRect(coord.secAbsX + sector.padding,
												coord.secAbsY-k.sel.map.tileHeight + sector.padding,
												k.sel.map.tileWidth/3,
												k.sel.map.tileHeight);
						}
					}
				}
				
				// Decrease the tile dirtyness
				k.links.canvas.dirty.set.byCoordSector(coord, sector, 0);
				
				// Remember if this sector actually holds any tiles
				if(sector.dirty.self.empty === undefined){
					
					/**
					 * If the tile is bigger or equal to zero, this sector is not empty.
					 * If it has the property 'drawUsers' it's also not empty
					 */
					if(tile.tilenr >= 0 || sector.layer.properties['drawUsers'] == 1) sectorEmpty = false;
				}
				
			}
		}
		
		// Do not loop through it a second time if the sector is completely clear
		if(!sectorDirty) break;
		
	}
	
	// Write back the emptyness
	if(sector.dirty.self.empty === undefined){
		sector.dirty.self.empty = sectorEmpty;
	}
	
	if(sectorDirty){
		// Set this sector's (and all its affiliated sectors') dirtyness
		k.links.canvas.dirty.set.sectorFamily(sector, 1);
	}
	
}

/**
 *Calculate the "mapOffset" of the user if we're moving when the map is drawn
 */
k.operations.render.calculateOffset = function(){
	
	// Store the previous mapp offset
	k.state.engine.prevMappOffsetX = k.state.engine.mappOffsetX;
	k.state.engine.prevMappOffsetY = k.state.engine.mappOffsetY;
	
	if(k.links.canvas.dirty.offset > 0){
		
		//This has to be floored, because pixels can't have a decimal value
		//And this would create 1 pixel spacing between the tiles while moving.
		k.state.engine.mappOffsetX = ~~((k.links.canvas.map.tileWidth *
					decimal(k.sel.position.zx)));
		
		k.state.engine.mappOffsetY = ~~((k.links.canvas.map.tileHeight *
					decimal(k.sel.position.zy)));
	}


}

/**
 *Every object has to be moved gradually. This function makes sure the coordinates
 *of the object are in the correct place before drawing them later on.
 */
k.operations.prerenderMoveObjects = function(){

    for(var objectId in k.collections.objects){

        // Apply the path to walk and move the object
        k.operations.walkPath(k.collections.objects[objectId]);
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
	
	if(objectId === undefined || !objectId) objectId = userPosition.uid;

    var position = animatedObjects[objectId]['position'];

    // Get the x and y coördinates if they haven't been given
    if(x === undefined) x = position.x;
    if(y === undefined) y = position.y;
    
    // Store the current map's tileWidth and Height, if it hasn't been given already
    if(tileWidth === undefined) tileWidth = k.collections.maps[animatedObjects[objectId]['map']]['tileWidth'];
    if(tileHeight === undefined) tileHeight = k.collections.maps[animatedObjects[objectId]['map']]['tileHeight'];

    // - a tilewidth and height to account for the 0,0 based positioning
    tempWidth = ((k.links.canvas.width - tileWidth) / 2);
    tempHeight = ((k.links.canvas.height - tileHeight) / 2);

    // When the screen is the correct multiple of the tilewidth, but half of it isn't an integer
    // we need to take that into account.
    if(tempWidth % k.collections.maps[animatedObjects[objectId]['map']]['tileWidth'] != 0){
        tempWidth = tempWidth - (tempWidth % k.collections.maps[animatedObjects[objectId]['map']]['tileWidth']);
    }
    if(tempHeight % k.collections.maps[animatedObjects[objectId]['map']]['tileHeight'] != 0){
        tempHeight = tempHeight - (tempHeight % k.collections.maps[animatedObjects[objectId]['map']]['tileHeight']);
    }

    var objX = (tempWidth - (Math.floor(animatedObjects[userPosition.uid]['position']['x']) * tileWidth)) + (x * tileWidth) - k.state.engine.mappOffsetX;
    var objY = (tempHeight - (Math.floor(animatedObjects[userPosition.uid]['position']['y']) * tileHeight)) + (y * tileHeight) - k.state.engine.mappOffsetY;

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
 * Draw an animated tile
 * @param	{k.Types.Tile}		tile
 * @param	{k.Types.Object}	object
 * @param	{string}			extraId
 */
k.operations.render.drawAnimated = function(tile, object, extraId){
	
	var ex = 0;
	var ey = 0;

	if(object !== undefined) {
		var layer = k.links.getLayer('Walkinglayer', object.map.name);
		var sector = k.links.getSector(object.position.coord, layer);
		var coord = object.position.coord;
		ex = k.state.engine.mappOffsetX;
		ey = k.state.engine.mappOffsetY;
	} else {
		var sector = tile.sector;
		var coord = tile.coord;
	}

	// Flag this tile for dirtyness due to being animated
	if(k.settings.engine.dirty)
	k.links.canvas.dirty.set.byAnimationCoord(tile, coord, sector);
	
	// Get the animated object state
	var animation = k.links.getAnimation(tile, object, extraId);
	if(animation.currentframe == 0) return;
    
    // Create a variable to hold our currentFrame
    var currentFrame = animation.currentframe;
	
    // We used to adjust tilenumber with their firstgid in drawTileSpecific, but that didn't make drawTileSpecific very specific.
    // Now we put one in drawTile and drawTileAnimated. Ideally we would stop using the tileGidOnMap for tileproperties, but
    // hey, this works.
    var adjustedFrame = currentFrame - (animation.tileset.firstgid - 1);
	
    try {
        // Draw the current frame
        k.operations.render.drawTileSpecific(
                         animation.tileset.name,   // The name of the tileset
                         adjustedFrame, // The number of the tile
                         coord.secAbsX + ex,            // The destination x position
                         coord.secAbsY + ey,             // The destination y position
						 sector,
						 object
                         );
                
    } catch(error) {
		k.debug.log(animation.currentframe + ' - from ts ' + tile.tileset.name + ' to coord (' + coord.absX + ',' + coord.absY + ')', error);
    }
    
    checkSameFrame(tile.tileset.name, tile.tilegid, animation.id); // See if we've already drawn this animation during this frame
        
    // Count the ammount of frames that need to pass before showing the next one
    frameWait = (k.state.engine.fpsr / animation.fps);
        
    // If there have been more frames than we should wait ...
    if(animation.framessince >= frameWait){

        // This animation is ready for the next frame!
        animation.currentframe = animation.nextframe;
        
        animation.framessince = 0; // Reset the framessince

        // If there is no new nextframe, end or loop back
        if(getTileProperty(tile.tileset.name, currentFrame, "nextframe") === undefined){
            
            animation.played++;        // Add a play to the counter

            // If the replay of the animation is not equal to one it's not done yet
            if(animation.replay != 1){

                // If the animation is bigger than zero (and one, as seen above) decrease the counter
                if(animation.replay>0) animation.replay--;
                
                // Don't forget to set the first tile again
                animation.currentframe = tile.tilegid;
                
            } else{
                // Setting the currentframe to zero will stop the animation the next time
                animation.currentframe = 0;
            }
            
            animation.framessince = 0; // Reset the framessince
            
        }else { // If there IS a nextframe, set it!
            
            // Without this IF everything still worked, but an error would still be thrown
            // because sometimes "tileProperties[tileSetName][currentFrame]" wouldn't exist.
            if(tileProperties[tile.tileset.name][currentFrame] !==undefined){
                var tempNextFrame = tileProperties[tile.tileset.name][currentFrame]['nextframe']; // Great, I forgot why this is different from the nextframe in the "if" outside this if. Look it up.
                
                // Set the new nextframe: back to the beginning or end it all?
                animation.currentframe = tempNextFrame;
                
            }
        }
    }
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
		k.state.animation.tiles[tileSetName][animationId]['framessince']++;
        
    }
}

/**
 * Draw a tile from the current map
 * @param	{k.Types.Tile}	tile
 * @param	{k.Types.CoordinatesClick} coord
 * @param	{k.Types.Sector}	sector
 * @param	{k.Types.Object}	object
 */
k.operations.render.drawTile = function(tile, coord, sector, object, extraId){

	// Declarations
	var movingObject;    // Is the object moving?
	var ex = 0;
	var ey = 0;

    // If this isn't an object the sourcemap is the current map we're on
    if(object !== undefined) {
	    if(object.path.length > (k.state.walk.indexNow + 1)) movingObject = true;
		tile.coord = deepCopy(coord);
		ex = k.state.engine.mappOffsetX;
		ey = k.state.engine.mappOffsetY;
    }

    if(tile.properties['beginanimation'] != undefined || movingObject == true){
		
        try {
			k.operations.render.drawAnimated(tile, object, extraId);
        } catch(error) {
			k.debug.log('[drawTile] Error drawing animated tile "<b>' + tile.tilenr + '</b>" from tileSet "<b>' + tile.tileset.name + '</b>" to coordinates (<b>' + tile.coord.secAbsX + '</b>,<b>' + tile.coord.secAbsY + '</b>)', error);
        }
    } else {
    
        try {
            k.operations.render.drawTileSpecific(tile.tileset.name, tile.tilenr+1, tile.coord.secAbsX + ex, tile.coord.secAbsY + ey, sector, object);
        } catch(error) {
			k.debug.log('Error drawing tile "<b>' + tile.tilenr + '</b>" from tileSet "<b>' + tile.tileset.name + '</b>" to coordinates (<b>' + tile.coord.secAbsX + '</b>,<b>' + tile.coord.secAbsY + '</b>)', error);
        }
    }

}

// tileNumber on the tileSet!
function getAutoTile(tileSetName, tileNumber, mapX, mapY){
    var ts = k.links.getTilesetByName(tileSetName);
	
	var debug = "";
    
    var coord = k.operations.coord.getByMap(mapX, mapY);
	
	mapX = parseInt(mapX);
	mapY = parseInt(mapY);
	
    var leftX = mapX - 1;
    var leftY = mapY;
    
    var lefttopX = mapX - 1;
    var lefttopY = mapY - 1;
    
    var topX = mapX;
    var topY = mapY - 1;
    
    var righttopX = mapX + 1;
    var righttopY = mapY - 1;
    
    var rightX = mapX + 1;
    var rightY = mapY;
    
    var rightbotx = mapX + 1;
    var rightbotY = mapY + 1;
    
    var botX = mapX;
    var botY = mapY + 1;
    
    var leftbotX = mapX - 1;
    var leftbotY = mapY + 1;
		
    // Calculate the original tileNumber's source x parameter (sx) on the tileset
    var sx = (Math.floor((tileNumber - 1) % ts.tpr) * ts.tileWidth);
    
    // Calculate this tileNumber's source y parameter (sy) on the tileset
    var sy = (Math.floor((tileNumber - 1) / ts.tpr) * ts.tileHeight);
	
	var oriTile = tileNumber;
	
	// Calculate the real tile number
	tileNumber = parseInt(ts.firstgid) + tileNumber - 1;
	
	// Check to see if it's animated (might have a different beginning)
	if(k.state.animation.begins[tileSetName][tileNumber] !== undefined)
		tileNumber = k.state.animation.begins[tileSetName][tileNumber];
    
	var sprites = {};
	
    // Build all the 4 sprites of the tile
    for(var s = 1; s < 5; s++){

        switch(s){
            
            case 1:
                var atile = 1 * isTileHere(leftX, leftY, tileNumber);
                var btile = 2 * isTileHere(lefttopX, lefttopY, tileNumber);
                var ctile = 4 * isTileHere(topX, topY, tileNumber);
                var spritenr1 = atile + btile + ctile;
                sprites[s] = k.collections.autotiles[s-1][spritenr1];
                break;
            
            case 2:
                var atile = 1 * isTileHere(rightX, rightY, tileNumber);
                var btile = 2 * isTileHere(righttopX, righttopY, tileNumber);
                var ctile = 4 * isTileHere(topX, topY, tileNumber);
                var spritenr2 = atile + btile + ctile;
                sprites[s] = k.collections.autotiles[s-1][spritenr2];
                break;
            
            case 3:
                var atile = 1 * isTileHere(leftX, leftY, tileNumber);
                var btile = 2 * isTileHere(leftbotX, leftbotY, tileNumber);
                var ctile = 4 * isTileHere(botX, botY, tileNumber);
                var spritenr3 = atile + btile + ctile;
                sprites[s] = k.collections.autotiles[s-1][spritenr3];
                break;
            
            case 4:
                var atile = 1 * isTileHere(rightX, rightY, tileNumber);
                var btile = 2 * isTileHere(rightbotx, rightbotY, tileNumber);
                var ctile = 4 * isTileHere(botX, botY, tileNumber);
                var spritenr4 = atile + btile + ctile;
				sprites[s] = k.collections.autotiles[s-1][spritenr4];
                break;
        }
	}
	
	if(k.cache.autotile[tileSetName] === undefined)
		k.cache.autotile[tileSetName] = {};
				
	if(k.cache.autotile[tileSetName][oriTile] === undefined)
		k.cache.autotile[tileSetName][oriTile] = {};
		
	// Look for this autotile in the cache
	var cachenr = spritenr1 + (spritenr2*10) + (spritenr3*100) + (spritenr4*1000);

	if(k.cache.autotile[tileSetName][oriTile][cachenr] === undefined){
	
		var tileCanvas = document.createElement('canvas');
		tileCanvas.width = k.links.canvas.map.tileWidth;
		tileCanvas.height = k.links.canvas.map.tileHeight;
		var tilectx = tileCanvas.getContext('2d');
		
		for(var s = 1; s < 5; s++){
			
			var sprite = sprites[s];
			
			// Set a margin, because the first 2 rows can't be fully used
			var margin = 4;
			var five = 4;
	
			switch(sprite){
				
				case 1:
				case 2:
					margin = 2;
					five = 0;
					break;
				
				case 3:
				case 4:
					margin = 4;
					five = 0;
					break;
			}
			
			sprite += margin;
			
			var spriterow = Math.floor((sprite - 1) / 4);
			var spriteloc = (sprite - (1+five)) % 4;
			
			
			var y = sy + ((ts.tileHeight/2) * spriterow);
			var x = sx + ((ts.tileWidth/2) * spriteloc);
			
			var dx = (ts.tileWidth/2) * ((s-1)%2);
			var dy = (ts.tileHeight/2) * Math.floor((s-1)/2);
			
			tilectx.drawImage(tileSet[tileSetName]["image"],
						  x, y, ts.tileWidth/2, ts.tileHeight/2,
						  dx, dy, ts.tileWidth/2, ts.tileHeight/2);
			
			k.cache.autotile[tileSetName][oriTile][cachenr] = tileCanvas;
		}

    }
	
	return k.cache.autotile[tileSetName][oriTile][cachenr];
}

/**
 * Detect if certain tilegid is on this map coordinate
 * Loops through all layers to find it, returns 0 if it's not there
 * 
 * @param   {integer} mapX   The X-tile on the map
 * @param   {integer} mapY   The Y-tile on the map
 * @param   {integer} tileNumber The total tilegid
 * 
 * @returns {integer} 1 if it's found, 0 of it's not
 */
function isTileHere(mapX, mapY, tileNumber){
    
    var mapName = k.links.canvas.mapName;
    
    var tile = calculateMapTile(mapX, mapY);
	
    
    for(var layer in k.links.canvas.map.layers){
		if(k.links.canvas.map.layers[layer]['data'][tile] == tileNumber) return 1;
    }
    
    return 0;
}

/**
 * Calculate the absolute number of a tile by its coordinate
 * 
 * @param   {integer} mapX   The X-tile on the map
 * @param   {integer} mapY   The Y-tile on the map
 * 
 * @returns {integer} The tile number
 */
function calculateMapTile(mapX, mapY){
	
    return mapY * k.collections.maps[k.links.canvas.mapName]['width'] + mapX;
}

/**
 * Draw a single specific tile from a specific tileset to the canvas
 * @param string    tileSetName  The name of the tileset to get the tile out of 
 * @param integer   tileNumber  The number of the tile in the tileset
 * @param float     dx          The destination X-coördinate
 * @param float     dy          The destination Y-coördinate
 * @param	{k.Types.Sector}     	sector     The sector
 * @param	{k.Types.Object}		object
 */
k.operations.render.drawTileSpecific = function(tileSetName, tileNumber, dx, dy, sector, object) {
	
	if(sector === undefined){
		var ctx = k.links.canvas.buffer;
	} else {
		var ctx = sector.ctx;
	}

	var ts = k.links.getTilesetByName(tileSetName);
	
	var tileNumberMap = parseInt(tileNumber) + (parseInt(ts.firstgid)-1);
	
	// Is this tile an autotile?
	var autotile = getTileProperty(tileSetName, tileNumberMap, "autotile");
	
	if(autotile) {
		
		var coord = k.operations.coord.getByMouse(sector.coord.absX + dx + k.state.engine.mappOffsetX,
												  sector.coord.absY + dy - ts.tileHeight + k.state.engine.mappOffsetY);

        var sourceimage = getAutoTile(tileSetName, tileNumber, coord.mapX, coord.mapY);
		
		var sx = 0;
		var sy = 0;
    }

    // Temporary located here: adjusting the dy parameter
    dy -= parseInt(tileSet[tileSetName]['tileHeight']);

    // Fetch the tilesPerRow from the tileset array
	tilesPerRow = tileSet[tileSetName]['tpr'];
    
    // Fetch the width of a tile
    tileWidth = tileSet[tileSetName]['tileWidth'];

    // Fetch the height of a tile
    tileHeight = tileSet[tileSetName]['tileHeight'];

    //End the function if no tileNumber is given
    if (!tileNumber) return;
	
	// Adjust the coordinates if it's an object, these are drawn on the canvas directly
	/*if(object !== undefined){
		dx += sector.coord.absX;
		dy += sector.coord.absY;
	}*/
	
	// Get our data from somewhere else if it's not a autotile
	if(!autotile){

		// Calculate this tileNumber's source x parameter (sx) on the tileset
		var sx = (~~((tileNumber - 1) % tilesPerRow) * tileWidth);
		
		// Calculate this tileNumber's source y parameter (sy) on the tileset
		var sy = (~~((tileNumber - 1) / tilesPerRow) * tileHeight);
		
		// The image we need to draw from
		var sourceimage = tileSet[tileSetName]["image"];
	}
	
    try {
		
        // Draw the tile on the canvas
        ctx.drawImage(sourceimage, sx, sy, tileWidth, tileHeight, dx + sector.padding, dy  + sector.padding, tileWidth, tileHeight);

    } catch (error) {
        k.debug.log('[drawTileSpecific] Error: ' + error.code + ' - ' +
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
    return k.collections.maps[mapname]['layers'][layername]['data'][y * k.collections.maps[mapname]['width'] + x];
}

/**
 * Get the info of a tileset by its name
 * @param	{string}	tileSetName		The name of the tileset
 * @returns {k.Types.tileSetInfo} TileSetInfo object
 */
k.links.getTilesetByName = function(tileSetName){
	
	return tileSet[tileSetName];
	
}

/**
 * Get the info of a tileset knowing only the map it's from and a tilenumber it has
 * @param mapname    {string}    The name of the map
 * @param tilenumer  {int}       The number of the tile in the tileset
 * @returns	 {k.Types.tileSetInfo} TileSetInfo object
 */
function getTileSetInfo(sourceMap, tileNumber){
    
    try{
        // Loop through all the tilesets in this map to determine which one we need
        for (var name in k.collections.maps[sourceMap]['tilesets']){
            
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
        k.debug.log('[getTileSetInfo] Had an error fetching "' + sourceMap + ', tileNumber: ' + tileNumber + ' -- ' + error);
    }
}

/**

 * Change the sprite of a moving object
 * @param 	{k.Types.Object}	object				The Id of the object to change
 * @param 	{string}			movementDirection   The direction this object has to face
 */
k.operations.render.changeObjectTiles = function(object, movementDirection){
        
	//Change the sprite of every layer if there is one specified for this move
	for (var layer = 0; layer < object.tiles.length; layer++){
		
		// Get this default tile
		var tile = k.links.getTileByChar(object.tiles[layer]);

		// Check if this object has a sprite for this movement
	   if(tile.properties[movementDirection] !== undefined){
			debugEchoLfps('Obj <b>' + object.id + '</b> has a sprite for '
						  + movementDirection + ' on layer ' + layer
						  + ':' + tile.properties[movementDirection]);
			
			object.state.tiles[layer] = k.links.getTileByGid(tile.properties[movementDirection], 'default.tmx');
			//animatedObjects[objectId]['spritesToDraw'][spriteNr] = parseInt(tileProperties[tileSetName][animatedObjects[objectId]['sprites'][spriteNr]][movementDirection])+tileSetCorrectGid;
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
        var objX = (((canvasWidth - k.collections.maps[userPosition.map]['tileWidth']) / 2) - (Math.floor(animatedObjects[userPosition.uid]['x']) * k.collections.maps[animatedObjects[userPosition.uid]['map']]['tileWidth'])) + (testPath[node]['x'] * k.collections.maps[animatedObjects[userPosition.uid]['map']]['tileWidth']) - k.state.engine.mappOffsetX;
        var objY = (((canvasWidth - k.collections.maps[userPosition.map]['tileHeight']) / 2) - (Math.floor(animatedObjects[userPosition.uid]['y']) * k.collections.maps[animatedObjects[userPosition.uid]['map']]['tileHeight'])) + (testPath[node]['y'] * k.collections.maps[animatedObjects[userPosition.uid]['map']]['tileHeight']) - k.state.engine.mappOffsetY;


        // Draw tile 309 (hardcoded, I know. It's in the grassland tileset
        k.operations.render.drawTile(279, objX, objY);

    }

}

/**
 * Blur function
 * @author flother
 * http://www.flother.com/blog/2010/image-blur-html5-canvas/
 */
function blur(context, element, passes) {
	var i, x, y;
	context.globalAlpha = 0.125;
	// Loop for each blur pass.
	for (i = 1; i <= passes; i += 1) {
		for (y = -1; y < 2; y += 1) {
			for (x = -1; x < 2; x += 1) {
			// Place eight versions of the image over the original
			// image, each with 1/8th of full opacity. The images are
			// placed around the original image like a square filter.
			// This gives the impression the image has been blurred,
			// but it's done at native browser speed, thus making it
			// much faster than writing a proper blur filter in
			// Javascript.
			context.drawImage(element, x, y);
			}
		}
	}
	context.globalAlpha = 1.0;
}