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
	
	// Are we moving, which indicates we need to redraw the sectors onto the map?
	this.moving = true;
	
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
		
		// A variable to store temporary sizes in
		var size = 0;
        
		// Start with the tile grid
        that.ctx.strokeStyle = "rgba(20, 20, 20, 0.7)";  
        
        // Draw horizontal lines
        for(var row = 0; row < (that.width/that.map.tileWidth); row++ ){
			
			size = row*that.map.tileWidth;
			
            that.ctx.beginPath();
            that.ctx.moveTo(0, size);  
            that.ctx.lineTo(that.width, size);
            that.ctx.stroke();
        }
        
        // Draw vertical lines
        for(var col = 0; col < (that.height/that.map.tileHeight); col++ ){
			
			size = col*that.map.tileHeight;
			
            that.ctx.beginPath();
            that.ctx.moveTo(size, 0);  
            that.ctx.lineTo(size, that.height);
            that.ctx.stroke();
        }
		
		// Now draw the sector grid
		that.ctx.strokeStyle = "rgba(0, 255, 0, 0.9)";
		
		// Get the upper left tile of the canvas
		for(var newposition = 0;
			newposition < (that.width / k.settings.engine.SECTORSIZE);
			newposition += k.settings.engine.SECTORSIZE){
			
			coord = k.operations.coord.getByCanvas(newposition,newposition);
			
			// Break out if we've found a correct one, not outside of the bound
			if(coord.sec > -1) break;
		}
        
        // Draw horizontal lines
        for(var row = 0; row < (that.width/that.map.tileWidth*k.settings.engine.SECTORSIZE); row++ ){
			
			size = row*that.map.tileWidth*k.settings.engine.SECTORSIZE-(coord.secY * that.map.tileWidth)-k.state.engine.mappOffsetY;
			
            that.ctx.beginPath();
            that.ctx.moveTo(0, size);  
            that.ctx.lineTo(that.width, size);
            that.ctx.stroke();
        }
        
        // Draw vertical lines
        for(var col = 0; col < (that.height/that.map.tileHeight*k.settings.engine.SECTORSIZE); col++ ){
			
			size = col*that.map.tileHeight*k.settings.engine.SECTORSIZE-(coord.secX * that.map.tileHeight)-k.state.engine.mappOffsetX;
			
            that.ctx.beginPath();
            that.ctx.moveTo(size, 0);  
            that.ctx.lineTo(size, that.height);
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
							   + precise(k.sel.position.y.toPrecision(2)) + ' '
					+ 'Tiles Drawn: ' + precise(k.state.debug.tilesDrawn.toPrecision(8)) + ' '
					+ 'Sect Drawn: ' + precise(k.state.debug.sectorsDrawn.toPrecision(8)), 5, 20);
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
	 * Set a single sector as dirty
	 * @param	{k.Types.Sector}	sector
	 * @param	{integer}			duration
	 */
	this.dirty.set.sector = function(sector, duration){
		
		var old = sector.dirty.self.counter;
		
		if (duration){
			// Increase the sector's data if it's the first time
			if (!sector.dirty.self.increased){
				sector.dirty.self.increased = true;
				
				if (sector.dirty.self.counter < 5){
					sector.dirty.self.counter += duration;
				}
				
				if (sector.fade.self.counter < 89){
					sector.fade.self.counter++;
				}
			}
			
		} else {
			// Decrease the sector's data if it's the first time
			if (!sector.dirty.self.decreased){
				sector.dirty.self.decreased = true;
				
				if (sector.dirty.self.counter > 0){
					sector.dirty.self.counter--;
				}
				
				if (sector.fade.self.counter > 0){
					sector.fade.self.counter--;
				}
			}
		}
		
	}
	
	/**
	 * Set a sector, and its top sectors, flagged for a redraw
	 * @param	{k.Types.Sector}	sector
	 */
	this.dirty.set.sectorFamily = function(sector, duration){
		
		if(duration === undefined) duration = 1;
		if(duration == 0){
			k.debug.log('Error: sectorFamily only meant to increase dirtyness');
			return;
		}

		// Loop through every layer in this sector's map
		for(var layername in sector.map.layers){
			
			var mdur = duration;
			
			// For some reason, this fails upon starting up. Maybe the layers aren't ready yet.
			try {
				var nsec = k.links.getSector(sector.coord, sector.map.layers[layername]);
			} catch(error) {
				k.debug.log('Error getting sector layer');
			}

			if(k.state.engine.drawn[nsec.map.name] !== undefined &&
			   k.state.engine.drawn[nsec.map.name][nsec.coord.sec] !== undefined &&
			   k.state.engine.drawn[nsec.map.name][nsec.coord.sec][nsec.layer.name] !== undefined){
				mdur = duration-1;
			}
			
			if(mdur < 0) mdur = 0;
			
			nsec.dirty.self.counter = mdur;
		}
	}
	
	/**
	 * Set an object as dirty
	 * @param	{k.Types.Object}	object		The object to flag as dirty
	 * @param	{integer}			duration	How long it's dirty
	 */
	this.dirty.set.byObject = function(object, duration){

		// Set the default duration to 1 if none is supplied
		if(duration === undefined) duration = 3;

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
		
		var layer = k.links.getLayer('Walkinglayer', k.sel.map.name);
		
		// Do this for every tile this sprite is wide
		for(var width = 0;
			width < (tileSet.tileWidth/that.map.tileWidth);
			width += 1){
			
			for(var height = 0;
				height < (tileSet.tileHeight/that.map.tileHeight);
				height += 1){
				
				var coord = k.operations.coord.getByMap(stepPrev.position.x + width,
														stepPrev.position.y - height)
				
				var sector = k.links.getSector(coord, layer);
				/**
				 * Decrease the duration for the previous position by one,
				 * because if it's higher than our current positions certain
				 * movements could cause the head to be cut off
				 */
				that.dirty.set.byCoordSector(coord, sector, duration);
				
				var coord = k.operations.coord.getByMap(stepNow.position.x + width,
														stepNow.position.y - height)
				
				var sector = k.links.getSector(coord, layer);
				that.dirty.set.byCoordSector(coord, sector, duration);
				
				if(stepNext) {
					
					var coord = k.operations.coord.getByMap(stepNext.position.x + width,
														stepNext.position.y - height)
					
					var sector = k.links.getSector(coord, layer);
					that.dirty.set.byCoordSector(coord, sector, duration);
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
	 * Flag an animated tile as dirty
	 * @param	{k.Types.Tile}	tile
	 * @param	{k.Types.CoordinatesClick}	coord
	 * @param	{k.Types.Sector}	sector
	 */
	this.dirty.set.byAnimationCoord = function(tile, coord, sector){
		
		// This works
		that.dirty.set.byCoordSector(coord, sector, 5);
		
		/*
		var ts = tile.tileset;
		// This doesn't yet, and is needed for animated tiles that are bigger
		// Than the standard tilesize
		for(var x = 0; x < ts.tileWidth; x = x + that.map.tileWidth){
			
			for(var y = 0; y < ts.tileHeight; y = y + that.map.tileHeight){
				
				//var ncoord = k.operations.coord.getByMouse(absX+x, absY+y - ts.tileHeight);
				var ncoord = k.operations.coord.getByMouse(coord.absX + x, coord.absY+y - ts.tileHeight);
				//var ncoord = k.operations.coord.getByMap(coord.mapX + (x % that.map.tileWidth),
				//										 coord.mapY + (y % that.map.tileHeight))
				
				that.dirty.set.byCoordSector(ncoord, sector, 5);
			}
		}*/
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
			if(sector.fade.tiles[coord.secLex] > 0){
				if(sector.fade.tiles[coord.secLex] < 89){
					sector.fade.tiles[coord.secLex] += 5;
				}
			} else {
				sector.fade.tiles[coord.secLex] = 20;
			}
			
			// Set the dirty duration
			if(sector.dirty.tiles[coord.secLex] > 0){
				
				// Let's keep it low, at about 4
				if(sector.dirty.tiles[coord.secLex] < 5){
					sector.dirty.tiles[coord.secLex] += duration;
				}
				
			} else {
				sector.dirty.tiles[coord.secLex] = duration;
			}
			
		} else {
			if(sector.fade.tiles[coord.secLex] > 0){
				sector.fade.tiles[coord.secLex]--;
			}
			
			// Decrease the dirtyness if it's over 0
			if(sector.dirty.tiles[coord.secLex] > 0){
				sector.dirty.tiles[coord.secLex]--;
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
		
		var dirty = sector.dirty.tiles[coord.secLex];
		
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
		
		// Clear the drawn object
		k.state.engine.drawn = {};

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
		/*
		for(var x in that.dirty.tiles){
			for(var y in that.dirty.tiles[x]){
				
				var fade = that.dirty.tiles[x][y]['fade']/100;
				
				var coord = k.operations.coord.getByCanvas(x, y);
				
				that.ctx.fillStyle = "rgba(0,150,150," + fade + ")";
				that.ctx.fillRect(coord.absX, coord.absY, that.map.tileWidth, that.map.tileHeight);
			}
		}*/
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
				var tile = k.links.getTileByMap(mapX, mapY, "Ground");
				
				// If there is no map here, draw black
				if(tile.coord.sec < 0) {
					continue;
				}
				
				// Get the sector at this position
				var sector = k.links.getSector(tile.coord, tile.layer);
				
				for(var seclex = 0; seclex < 15; seclex++){
				
					var coord = k.operations.coord.getBySecLex(sector, seclex);
					
					fade = sector.fade.tiles[seclex] / 100;
					
					that.ctx.fillStyle = "rgba(0,150,150," + fade + ")";
					that.ctx.fillRect(coord.absX, coord.absY, that.map.tileWidth, that.map.tileHeight);
					
				}
				
				
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