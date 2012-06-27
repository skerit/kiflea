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
 * Initialize a canvas element
 * @classDescription  This class creates a new canvas.
 * @param  {string}   canvasId  The id of the canvas to load
 * @return {object}   Return our own Canvas element
 * @constructor
 */
k.classes.Canvas = function(canvasId){

	/**
	 * @type {k.classes.Canvas} A reference for inner functions to reach parent
	 */
	var that = this;
	
	this.canvasId = canvasId;

	// Retrieve the canvas DOM node, this gives us access to its drawing functions
	this.ctx = document.getElementById(canvasId).getContext('2d');

	// Get the width and height of the element
	this.width = document.getElementById(canvasId).width;
	this.height = document.getElementById(canvasId).height;
	
	// How many tiles do we show on the canvas?
	this.tpr = 0;
	this.tpc = 0;
	this.totaltiles = 0;
	
	// How many sectors do we show on the canvas?
	this.spr = 0;
	this.spc = 0;
	this.totalsectors = 0;
	
	// The background color to draw on the canvas
	this.background = 'rgb(0,0,0)';
	
	// Should we draw the world or not this render?
	this.drawWorld = true;
	
	// Store things we do only one time per render
	this.once = {};
	this.once.clear = false;
	this.once.messages = [];
	
	// Store the state of the canvas in here
	this.state = {};
	this.state.fpsf = [];
	this.state.fpsr = [];
	this.state.msf = 0;
	this.state.msr = 0;
	this.state.msfTimer = now();
	this.state.msrTimer = now();
	
	// Variables containing dirty settings
	this.dirty = {};
	this.dirty.buffer = 3;	// Use a buffer of 3 tiles outside of the canvas
	this.dirty.tiles = {};

	this.dirty.sectors = {};
	this.dirty.cleaned = {};

	this.dirty.get = {};
	this.dirty.set = {};
	
	// Do we have to calculate the offset? Is set to false after every render
	this.dirty.offset = 3;
	
	// The current map we're working on
	this.mapName = "";
	
	/**
	 * @type {k.Types.Map}
	 */
	this.map = {};

	// If the RECORD var is true, create a movie object
	if(k.settings.debug.RECORD) this.movie = new CanvasReplay(this.width,  this.height);

	// Mouse settings
	this.mouse = {};
	this.mouse.x = 0;               // Where is the cursor now?
	this.mouse.y = 0;               // Where is the cursor now?
	this.mouse.down = false;        // Is the mouse pressed down?
	this.mouse.downx = 0;           // Where was the mouse pressed down?
	this.mouse.downy = 0;           // Where was the mouse pressed down?
	this.mouse.upx = 0;             // Where was the mouse last released?
	this.mouse.upy = 0;             // Where was the mouse last released?
	this.mouse.dialogDown = false;  // The dialog window we have under our cursor when pressing down
	this.mouse.dialogUp = false;    // The dialog window we have under our cursor when releasing the mouse button
	this.mouse.underType;           // What is beneath the mouse now?
	this.mouse.focus = false;       // What has focus right now?

	// Create a buffer canvas. We'll draw everything to this first
	this.bufferElement = document.createElement('canvas');

	// Set the resolution of the buffer element
	this.bufferElement.width = this.width;
	this.bufferElement.height = this.height;

	// Get the buffer context
	this.buffer = this.bufferElement.getContext('2d');

	/**
	 * Copy the buffer over to the actual canvas
	 */
	this.flush = function(){
		this.ctx.drawImage(this.bufferElement, 0 ,0);

		// If the RECORD variable is true, add the current frame to the movie
		if(k.settings.debug.RECORD) this.movie.addImage(document.getElementById(this.canvasId));
		
		// Draw the dirty rectangle fades if we want it
		if(k.settings.debug.DIRTY) that.drawFadeness();
        
        // Draw the grid if we want it
        if(k.settings.debug.GRID == true) that.drawGrid();
        
        // Draw the FPS information if we want it
        if(k.settings.debug.FPS == true) that.drawFps();
		
		// Draw more debug info
		if(k.settings.debug.FPS == true) that.drawMoreDebug();
        
	}
    
    /**
     *Draw a grid on the canvas
     */
    this.drawGrid = function(){
        
        that.ctx.strokeStyle = "rgba(20, 20, 20, 0.7)";  
        
        // Draw horizontal lines
        for(var row = 0; row < (that.width/that.map.tileWidth); row++ ){
            that.ctx.beginPath();
            that.ctx.moveTo(0, row*that.map.tileWidth);  
            that.ctx.lineTo(that.width, row*that.map.tileWidth);
            that.ctx.stroke();
        }
        
        // Draw vertical lines
        for(var col = 0; col < (that.height/that.map.tileHeight); col++ ){
            that.ctx.beginPath();
            that.ctx.moveTo(col*that.map.tileHeight, 0);  
            that.ctx.lineTo(col*that.map.tileHeight, that.height);
            that.ctx.stroke();
        }
		
		that.ctx.strokeStyle = "rgba(0, 255, 0, 0.7)";  
        
        // Draw horizontal lines
        for(var row = 0; row < (that.width/that.map.tileWidth*k.settings.engine.SECTORSIZE); row++ ){
            that.ctx.beginPath();
            that.ctx.moveTo(0, row*that.map.tileWidth*k.settings.engine.SECTORSIZE);  
            that.ctx.lineTo(that.width, row*that.map.tileWidth*k.settings.engine.SECTORSIZE);
            that.ctx.stroke();
        }
        
        // Draw vertical lines
        for(var col = 0; col < (that.height/that.map.tileHeight*k.settings.engine.SECTORSIZE); col++ ){
            that.ctx.beginPath();
            that.ctx.moveTo(col*that.map.tileHeight*k.settings.engine.SECTORSIZE, 0);  
            that.ctx.lineTo(col*that.map.tileHeight*k.settings.engine.SECTORSIZE, that.height);
            that.ctx.stroke();
        }
    }
	
	/**
	 * Draw more debug information
	 */
	this.drawMoreDebug = function() {
		
		mc.fillStyle = "rgba(20, 20, 20, 0.7)";  
		mc.fillRect (2, 4, 400, 20);
		mc.strokeStyle = "white";  
		mc.font = "12px monospace";
		mc.strokeText('User: ' + precise(k.sel.position.x.toPrecision(2)) + ','
							   + precise(k.sel.position.y.toPrecision(2)) + ' ', 5, 20);
	}
    
    /**
     * Draw FPS information on the canvas itself
     */
    this.drawFps = function(){
       
       that.ctx.fillStyle = "rgba(20, 20, 20, 0.7)";  
       that.ctx.fillRect (2, that.height-33, that.width-4, 20);
       that.ctx.strokeStyle = "white";  
       that.ctx.font = "12px monospace";
       that.ctx.strokeText('Fake ms: ' + precise(k.state.engine.msf.toPrecision(4)) + ' - ' +
						   'Real ms: ' + precise(k.state.engine.msr.toPrecision(4))  + ' - ' +
						   'Fake fps: ' + precise(Math.round(k.state.engine.fpsf).toPrecision(4)) + ' - ' +
						   'Real fps: ' + precise(Math.round(k.state.engine.fpsr).toPrecision(4)), 5, that.height-20);
    }
	
	/**
	 * Prepare a certain map
	 */
	this.prepareMap = function(mapname){
		
		if(that.mapName != mapname){
			that.mapName = mapname;
			
			var newMap = k.links.getMap(mapname);
			
			// Clear the coordination cache if the map dimensions differ
			if(newMap.width != that.map.width ||
			   newMap.height != that.map.height) k.cache.clear.coord();
			
			that.map = newMap;
			
			// Set the tile counts
			that.tpr = ~~(that.width / that.map.tileWidth);
			that.tpc = ~~(that.height / that.map.tileHeight);
			that.totaltiles = that.tpr * that.tpc;
			
			that.spr = Math.ceil(that.tpr / k.settings.engine.SECTORSIZE);
			that.spc = Math.ceil(that.tpc  / k.settings.engine.SECTORSIZE);
			that.totalsectors = that.spr * that.spc;
			
			// Create the cache object for this map
			k.cache.map[mapname] = {};
			
			// And for every layer object in that map
			for(var layer in newMap.layers){
				
				// Create the layer
				k.cache.map[mapname][layer] = {};
			}
			
			// Recreate the dirty map
			that.dirty.set.create();
			
			// Set the background color
			if(that.map.properties.backgroundcolor !== undefined){
				that.background = k.links.canvas.map.properties.backgroundcolor;
			}
			
		}
	}
	
	
	/**
	 * Set the offset dirtyness
	 */
	this.dirty.set.offset = function(duration){
		
		// Set the offset dirtyness
		if(duration > 0){
			if(that.dirty.offset < 5) that.dirty.offset += duration;
		} else {
			if(that.dirty.offset > 0) that.dirty.offset--;
		}	
	}
	
	/**
	 * Set a sector as dirty
	 * @param	{k.Types.CoordinatesClick}	coord
	 * @param	{k.Types.Map}				map
	 * @param	{k.Types.mapLayer}			layer
	 */
	this.dirty.set.sector = function(coord, map, layer, duration){
		
		// Set the default duration to 1 if none is supplied
		if(duration === undefined) duration = 1;
		
		// Make sure this is not out of bounds:
		if(that.dirty.sectors[map.name] === undefined)
			that.dirty.sectors[map.name] = {};
		
		if(that.dirty.sectors[map.name][layer.name] === undefined)
			that.dirty.sectors[map.name][layer.name] = {};
		
		if(that.dirty.sectors[map.name][layer.name][coord.sec] === undefined)
			that.dirty.sectors[map.name][layer.name][coord.sec] = {};
		
		var link = that.dirty.sectors[map.name][layer.name][coord.sec];
		
		// Increase or decrease the duration
		// And set the fadeness (for debugging)
		if(duration){
			
			// Set the fade
			if(link['fade'] > 0){
				if(link['fade'] < 89){
					link['fade'] += 5;
				}
			} else {
				link['fade'] = 20;
			}
			
			// Set the dirty duration
			if(link['dirty'] > 0){
				
				// Let's keep it low, at about 4
				if(link['dirty'] < 5){
					link['dirty'] += duration;
				}
				
			} else {
				link['dirty'] = duration;
			}
			
		} else {
			if(link['fade'] > 0){
				link['fade']--;
			}
			
			// Decrease the dirtyness if it's over 0
			if(link['dirty'] > 0){
				link['dirty']--;
			}
		}
		
	}
	
	/**
	 * Set a certain tile as dirty by its canvas coordinates
	 */
	this.dirty.set.byCanvas = function(canvasX, canvasY, duration){

		// Set the default duration to 1 if none is supplied
		if(duration === undefined) duration = 1;
		
		// Make sure this is not out of bounds:
		if(that.dirty.tiles[canvasX] === undefined) return;
		if(that.dirty.tiles[canvasX][canvasY] === undefined) return;
		
		var coord = k.operations.coord.getByCanvas(canvasX, canvasY);

		// Increase or decrease the duration
		// And set the fadeness (for debugging)
		if(duration){
			
			// Set the fade
			if(that.dirty.tiles[canvasX][canvasY]['fade'] > 0){
				if(that.dirty.tiles[canvasX][canvasY]['fade'] < 89){
					that.dirty.tiles[canvasX][canvasY]['fade'] += 5;
				}
			} else {
				that.dirty.tiles[canvasX][canvasY]['fade'] = 20;
			}
			
			// Set the dirty duration
			if(that.dirty.tiles[canvasX][canvasY]['dirty'] > 0){
				
				// Let's keep it low, at about 4
				if(that.dirty.tiles[canvasX][canvasY]['dirty'] < 5){
					that.dirty.tiles[canvasX][canvasY]['dirty'] += duration;
				}
				
			} else {
				that.dirty.tiles[canvasX][canvasY]['dirty'] = duration;
			}
			
		} else {
			if(that.dirty.tiles[canvasX][canvasY]['fade'] > 0){
				that.dirty.tiles[canvasX][canvasY]['fade']--;
			}
			
			// Decrease the dirtyness if it's over 0
			if(that.dirty.tiles[canvasX][canvasY]['dirty'] > 0){
				that.dirty.tiles[canvasX][canvasY]['dirty']--;
			}
		}

	}
	
	/**
	 * Set a certain tile as dirty by its map coordinates
	 * 
	 * @param   {Integer} mapX     The x-coordinate on the entire map
	 * @param   {Integer} mapY     The y-coordinate on the entire map
	 * @param   {Integer} duration How many frames we want it to be dirty
	 * 
	 */
	this.dirty.set.byMap = function(mapX, mapY, duration){
		
		// Get the canvas coordinates
		var coord = k.operations.coord.getByMap(mapX, mapY);
		
		// Use the canvas coordinates to set the tile as dirty
		that.dirty.set.byCanvas(coord.canvasX, coord.canvasY);
		
	}
	
	/**
	 * Set a certain tile as dirty by its absolute canvas coordinates
	 * 
	 * @param   {Integer} absX     The x-coordinate on the entire map
	 * @param   {Integer} absY     The y-coordinate on the entire map
	 * @param   {Integer} duration How many frames we want it to be dirty
	 * 
	 */
	this.dirty.set.byAbsolute = function(absX, absY, duration){
		
		// Get the canvas coordinates
		var coord = k.operations.coord.getByMouse(absX, absY);
		
		// Use the canvas coordinates to set the tile as dirty
		that.dirty.set.byCanvas(coord.canvasX, coord.canvasY, duration);
		
	}
	
	/**
	 * Set an object as dirty
	 * @param	{k.Types.Object}	object		The object to flag as dirty
	 * @param	{integer}			duration	How long it's dirty
	 */
	this.dirty.set.byObject = function(object, duration){
		return;
		// Set the default duration to 1 if none is supplied
		if(duration === undefined) duration = 1;

		// If it's our user, set the offset dirtyness too
		if(object.id == k.sel.id) that.dirty.set.offset(duration);
		
		// IDE Hack: Enables autocomplete suport because object[] does not work
		var tile = k.links.getObjectTile(object);
		
		// Get the tileset info of the sprite, needed for its tile dimensions
		var tileSet = tile.tileset;
		
		// The steps of the object
		var stepPrev = k.links.step.get(object, k.state.walk.indexPrev);
		var stepNow = object.path[k.state.walk.indexNow];
		var stepNext = object.path[k.state.walk.indexNext];
		
		// Do this for every tile this sprite is wide
		for(var width = 0;
			width < (tileSet.tileWidth/that.map.tileWidth);
			width += 1){
			
			for(var height = 0;
				height < (tileSet.tileHeight/that.map.tileHeight);
				height += 1){
				
				that.dirty.set.byMap(stepPrev.position.x + width,
									 stepPrev.position.y - height, duration);
				
				that.dirty.set.byMap(stepNow.position.x + width,
									 stepNow.position.y - height, duration);
				
				if(stepNext) {
					that.dirty.set.byMap(stepNext.position.x + width,
										 stepNext.position.y - height,duration);
				}
			}
		}
	}
	
	/**
	 * Flag an animated tile as dirty
	 */
	this.dirty.set.byAnimation = function(absX, absY, tileSetName){
		
		var ts = k.links.getTilesetByName(tileSetName);
		
		for(var x = 0; x < ts.tileWidth; x = x + that.map.tileWidth){
			
			for(var y = 0; y < ts.tileHeight; y = y + that.map.tileHeight){
				
				var coord = k.operations.coord.getByMouse(absX+x, absY+y - ts.tileHeight);
				
				that.dirty.set.byCanvas(coord.canvasX, coord.canvasY, 5);
				
			}
		}
	}
	
	/**
	 * Set a certain tile as dirty by its coord
	 * @param	{k.Types.CoordinatesClick}	coord
	 * @param	{k.Types.Sector}			sector
	 */
	this.dirty.set.byCoordSector = function(coord, sector, duration){

		// Set the default duration to 1 if none is supplied
		if(duration === undefined) duration = 1;
		
		// Increase or decrease the duration
		// And set the fadeness (for debugging)
		if(duration){
			
			// Set the fade
			if(sector.fadeTiles[coord.secLex] > 0){
				if(sector.fadeTiles[coord.secLex] < 89){
					sector.fadeTiles[coord.secLex] += 5;
				}
			} else {
				sector.fadeTiles[coord.secLex] = 20;
			}
			
			// Set the dirty duration
			if(sector.dirtyTiles[coord.secLex] > 0){
				
				// Let's keep it low, at about 4
				if(sector.dirtyTiles[coord.secLex] < 5){
					sector.dirtyTiles[coord.secLex] += duration;
				}
				
			} else {
				sector.dirtyTiles[coord.secLex] = duration;
			}
			
		} else {
			if(sector.fadeTiles[coord.secLex] > 0){
				sector.fadeTiles[coord.secLex]--;
			}
			
			// Decrease the dirtyness if it's over 0
			if(sector.dirtyTiles[coord.secLex] > 0){
				sector.dirtyTiles[coord.secLex]--;
			}
		}

	}
	
	/**
	 * Is this tile dirty, by its coordinates
	 * 
	 * @param	{k.Types.CoordinatesClick}	coord
	 * @param	{k.Types.Sector}			sector
	 * 
	 */
	this.dirty.get.byCoordSector = function(coord, sector){
		
		// If dirty rectangles have been disabled, always return true
		if(!k.settings.engine.dirty) return true;
		
		var dirty = sector.dirtyTiles[coord.secLex];
		
		if(dirty > 0) return true;
		else return false;
	}
	
	/**
	 * Get a sector's dirtyness
	 * @param	{k.Types.CoordinatesClick}	coord
	 * @param	{k.Types.Map}				mapOrName
	 * @param	{k.Types.mapLayer}			layerOrName
	 */
	this.dirty.get.sector = function(coord, mapOrName, layerOrName){
		
		if(typeof mapOrName == "string") mapname = mapOrName;
		else mapname = map.name;
		
		if(typeof layerOrName == "string") layername = layerOrName;
		else layername = layer.name;
		
		// If dirty rectangles have been disabled, always return true
		if(!k.settings.engine.dirty) return true;

		// Make sure this is not out of bounds:
		if(that.dirty.sectors[mapname] === undefined)
			return true;
		
		if(that.dirty.sectors[mapname][layername] === undefined)
			return true;
		
		if(that.dirty.sectors[mapname][layername][coord.sec] === undefined)
			return true;
		
		var link = that.dirty.sectors[mapname][layername][coord.sec];
		
		if(link.dirty > 0) return true;
		else return false;
	}
	
	
	/**
	 * Queue loading message
	 */
	this.addLoadingMessage = function(text){
		
		// Add the message to the queue
		that.once.messages.push(text);
		
		// Since we've added a loading message, indicate we'll skip
		// the rest of the world render
		that.skipWorldRender();
	}
	
	/**
	 * Draw load messages
	 */
	this.drawLoadingMessages = function(){
		
		that.clear("rgba(200,200,200,0.9)");
		that.buffer.fillStyle = "rgba(255,255,255,1)";
		that.buffer.font = "20pt Arial";
		
		var messages = that.once.messages.length;
		var lines = messages * 70;

		for(var count in that.once.messages){
			
			// Temporarily store the message
			var loadMessage = that.once.messages[count];
			
			// Calculate the width of the message
			var loadWidth = that.buffer.measureText(loadMessage);
			
			// Calculate the x and y coordinates
			var drawX = (that.width-loadWidth.width)/2;
			var drawY = (that.height-(lines - (70 * count+1))) / 2;
			
			// Draw the text to the buffer
			that.buffer.fillText(loadMessage, drawX, drawY);
		}
		
		// Flush the buffer
		that.flush();
		
	}
	
	/**
	 * Indicate that we're starting a render
	 */
	this.beginRender = function(){
		
		if(k.links.framedebug) k.links.framedebug.innerHTML = '';
		
		that.state.msfTimer = now();
	}
	
	/**
	 * Indicate we've finished a render
	 */
	this.finishedRender = function(){
		that.once.clear = false;
		that.once.messages = [];
		that.drawWorld = true;
		
		// If the array is getting too long, remove the first element
		if(that.state.fpsf.length > 25) that.state.fpsf.shift();
		if(that.state.fpsr.length > 25) that.state.fpsr.shift();
		
		// Calculate fake ms & fps (time it took to draw this loop)
		that.state.msf = (now() - that.state.msfTimer);
		that.state.fpsf.push(1000/that.state.msf);

		// Calculate real ms & fps (time it took to draw this loop + gap between loop)
		that.state.msr = (now() - that.state.msrTimer);
		that.state.fpsr.push(1000/that.state.msr);
		
		// Save the average FPS and ms data
		k.state.engine.msf = that.state.msf;
		k.state.engine.msr = that.state.msr;
		k.state.engine.fpsr = mean(that.state.fpsr);
		k.state.engine.fpsf = mean(that.state.fpsf);
		
		// Start the real fps counter
		that.state.msrTimer = now();
	}
	
	/**
	 * Indicate we do not want to draw the world this render
	 */
	this.skipWorldRender = function(){
		this.drawWorld = false
	}
	
	/**
	 *  Calculate the visibletiles per row
	 *  @param		{integer}	tilewidth	The width of a tiles
	 *  @returns 	{integer}	The ammount of tiles visible per row
	 */
	this.visibletilesx = function(tilewidth){
		return this.width / tilewidth;
	}

	/**
	 *  Calculate the visibletiles per column
	 *  @param		{integer}	tileheight	The height of a tiles
	 *  @returns 	{integer}	The ammount of tiles visible per column
	 */
	this.visibletilesy = function(tileheight){
		return this.height / tileheight;
	}

	/**
	 *  Clear the canvas
	 *  @param		{string=}	backgroundColor 	The color to draw
	 */
	this.clear = function(backgroundColor){

		// Use the default color if none is provided
		if(backgroundColor === undefined) backgroundColor = k.settings.engine.background;

		// Draw the rectangle
		this.buffer.fillStyle = backgroundColor;
		this.buffer.fillRect(0, 0, this.width, this.height);
	}
	
	/**
	 * Clear a certain tile on the canvas
	 * @param	{k.Types.Tile}	The tile to clear
	 */
	this.clearTile = function(tile){
		
		// Use the default color if none is provided
		if(backgroundColor === undefined) backgroundColor = k.settings.engine.background;
		
		// Draw the rectangle
		this.buffer.fillStyle = backgroundColor;
		this.buffer.fillRect(tile.coord.absX, tile.coord.absY, that.map.tileWidth, that.map.tileHeight);
		
	}
	
	this.drawFadeness = function(){
		
		for(var x in that.dirty.tiles){
			for(var y in that.dirty.tiles[x]){
				
				var fade = that.dirty.tiles[x][y]['fade']/100;
				
				var coord = k.operations.coord.getByCanvas(x, y);
				
				that.ctx.fillStyle = "rgba(0,150,150," + fade + ")";
				that.ctx.fillRect(coord.absX, coord.absY, that.map.tileWidth, that.map.tileHeight);
			}
		}
		
	}
	
	/**
	 * Prepare a certain tile and return if something needs to be done
	 * @param	{k.Types.Tile}	tile	The tile to prepare
	 * @return	{bool}			Wether to do something to this tile or not
	 */
	this.prepareTile = function(tile){

		// If the tile isn't dirty: do nothing
		if(!tile.dirty) return false;
		
		if(tile.layer.nr == 1) {
			// Clear the tile on the bottom layer
			that.clearTile(tile);
		}
		
		// Is this tile out of bounds?
		// Then draw the background color if it's on the first layer and return
		if(tile.coord.lex < 0) {
				
			if(tile.layer.nr == 1) {
				that.buffer.fillStyle = "rgb(0, 0, 0)";
				that.buffer.fillRect(tile.coord.absX,
									tile.coord.absY,
									that.map.tileWidth,
									that.map.tileHeight);
			}
			
			return false;
		}	
		
		if(tile.tilegid && tile.properties['draw'] === undefined) {
			return true;
		} else {
			return false;
		}

	}
		
	/**
	 * Clear the canvas once during this draw
	 * @param		{string=}	backgroundColor 	The color to draw
	 */
	this.clearonce = function(backgroundColor){
		if(!this.once.clear) this.clear(backgroundColor);
		this.once.clear = true;
	}

	// Disable "selecting" the canvas when clicked.
	var element = document.getElementById(canvasId);
	element.onselectstart = function () { return false; }

	// What to do when the mouse moves over this canvas
	$('#'+canvasId).mousemove( function(e) {

		that.mouse.x = e.pageX-this.offsetLeft;
		that.mouse.y = e.pageY-this.offsetTop;
		
	});

	// Store the mouse position when pressing down a button
	$('#'+canvasId).mousedown(function(e){

		that.mouse.downx = e.pageX-this.offsetLeft;
		that.mouse.downy = e.pageY-this.offsetTop;

	});

	// Store the mouse position when releasing (clicking) down a button
	$('#'+canvasId).mouseup(function(e){

		that.mouse.upx = e.pageX-this.offsetLeft;
		that.mouse.upy = e.pageY-this.offsetTop;
		
		console.log(k.operations.coord.getByMouse(that.mouse.upx, that.mouse.upy));
		var sector = k.links.getSector(k.operations.coord.getByMouse(that.mouse.upx, that.mouse.upy), k.links.canvas.map.layers.Ground);
		console.log(sector);
		
		
		dc.drawImage(sector.element, 100, 100);

	});

	// Now check if we actually have a canvas object.
	// If we don't, this browser doesn't support it
	if(this.ctx) {
		this.loaded = true;
		debugEcho('Canvas has been initialized');
		dc = document.getElementById('debugcanvas').getContext('2d');
		mc = document.getElementById('moredebugcanvas').getContext('2d');
	} else {
		this.loaded = false;
	}
}