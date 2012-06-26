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
 * The Kiflea namespace object
 */
var k = {};

var dc = {};

k = {
	settings:{		
		debug:{},
		server:{},
		ids:{},
		engine:{},
		walk:{}
	},
	
	state:{
		engine:{},
		load:{},
		animation:{},
		server:{},
		output:{},
		walk:{},
		hud:{},
		dirty:{x: {}},
		debug:{},
		keyboard:{},
		position:{}
	},
	
	collections:{tilegid: {}, chars:{}, alias:{}},
	classes:{},
	links:{step:{}},
   
	operations:{
		server:{},
		load:{},
		walk:{},
		interface:{},
		keyboard:{},
		coord:{},
		render:{},
		step: {}
	},
	
	events: {},
	actions: {},
	cache: {},
	
	/**
	 * The object of our current user
	 * @type	{k.Types.Object}
	 */
	me: {},
	
	/**
	 * The object of our SELECTED user (probably k.me)
	 * @type	{k.Types.Object}
	 */
	sel: {}
};

/**
 * Do we want to enable debugging?
 * @define {boolean}
 */
k.settings.debug.DEBUG = true;

/**
 * show debug info on movement
 * @define {boolean}
 */
k.settings.debug.MOVEMENT = false;

/**
 * Show debug info on HUD changes
 * @define {boolean}
 */
k.settings.debug.HUD = false;

/**
 * Draw debug grid
 * @define {boolean}
 */
k.settings.debug.GRID = false;

/**
 * Draw dirty rectangle fadeness
 * @define {boolean}
 */
k.settings.debug.DIRTY = false;

/**
 * Draw debug FPS information
 * @define {boolean}
 */
k.settings.debug.FPS = true;

/**
 * Show debug info on pathfinding
 * @define {boolean}
 */
k.settings.debug.PATH = false;

/**
 * The ammount of extra previous paths to remember.
 *  @define {integer}
 */
k.settings.debug.PATHHISTORY = 1;

/**
 * Record our movement and debug text so we can play it back later?
 *  @define {bool}
 */
k.settings.debug.RECORD = false;

/**
 * Do we want to connect to a server or not?
 * @define {boolean}
 */
k.settings.server.CONNECT = true;

/**
 * What port should we connect to?
 * @define {integer}
 */
k.settings.server.PORT = 1234;

/**
 * What's the address of the server?
 *  @define {string}
 */
k.settings.server.ADDRESS = "ws://kipdola.be";

/**
 * What's our target FPS?
 * @define {integer}
 */
k.settings.engine.fps = 10;

/**
 * The default background color to draw on the canvas
 * @define {string}
 */
k.settings.engine.background = 'rgb(255,255,255)';

/**
 * The amount of extra tiles to draw (outside the canvas)
 * @define {integer}
 */
k.settings.engine.drawextras = 3;

/**
 * Use dirty rectangles?
 * @define {bool}
 */
k.settings.engine.dirty = true;

/**
 * The amount of steps to queue
 * @define {integer}
 */
k.settings.walk.MAXQUEUE = 2;

/**
 * The time it takes to walk from one tile to another (at tilespeed 1.0)
 * @define {integer}
 */
k.settings.walk.msPerTile = 200;

/**
 * The map which holds the tiles for the objects and users and such.
 * This map isn't actually useable, but this way we can use tiled to quickly edit tile preferences.
 *  @define {string}
 */
k.settings.engine.DEFAULTSPRITES = 'default.tmx';

/**
 * All the mapfiles that need to be loaded when no server is required
 */
k.settings.engine.MAPS = ['map.tmx', k.settings.engine.DEFAULTSPRITES];

/**
 * The url from where we'll be downloading the files
 * @define {string}
 */
k.settings.engine.BASEURL = 'http://kipdola.be/subdomain/kiflea/';

/**
 * How big can a map sector be?
 * @define	{integer}
 */
k.settings.engine.SECTORSIZE = 4;

/**
 * The id of the canvas element
 * @define {string}
 */
k.settings.ids.CANVAS = 'flatearth';

/**
 * The id of the echo div
 * @define {string}
 */
k.settings.ids.ECHO = 'echo';

/**
 * The id of the debug div (for framerates)
 * @define {string}
 */
k.settings.ids.DEBUG = 'debug';

/**
 * The id of the frame debug element
 * @define {string}
 */
k.settings.ids.FRAMEDEBUG = 'frameecho';

/**
 * These values change during runtime
 */

/**
 * Store things which have already been echoed out
 */
k.state.debug.once = {};

/**
 * Every echoDebug() called will also print this time.
 * @define {integer}
 */
k.state.debug.counter = 0;

/**
 * Are we connected to the server?
 */
k.state.server.connected = false;

/**
 * Are we initiated?
 */
k.state.server.initiated = false;

k.state.recording = false;

/**
 * Total count of things that need to be loaded
 * @type    {number}
 */
k.state.load.toload = 0;

/**
 * Total count of things that have been loaded
 * @type    {number}
 */
k.state.load.loaded = 0;

/**
 * Has the final loading function completed?
 * @type    {Boolean}
 */
k.state.load.finished = false;

/**
 * Total count of tilesets that need to be loaded
 * @type    {number}
 */
k.state.load.toloadTilesets = 0;

/**
 * Total count of tilesets that have been loaded
 * @type    {number}
 */
k.state.load.loadedTilesets = 0;

k.state.load.loadedHud = false;	// If the hud has been loaded
k.state.load.loadedMap = false;	// If the map has been loaded


k.state.engine.prevMappOffsetX = 0;		// The previous offset of the map in relation to our user
k.state.engine.prevMappOffsetY = 0;

k.state.engine.mappOffsetX = 0;		// The current offset of the map in relation to our user
k.state.engine.mappOffsetY = 0;

k.state.engine.msfTimer = 0;
k.state.engine.msrTimer = 0;
k.state.engine.msf = 0;		// The fake ms time (time it takes to start and end a draw)
k.state.engine.msr = 0;		// The real ms time (fake ms + time between draws)
k.state.engine.fpsf = 0;		// The fake fps (1000 / msf)
k.state.engine.fpsr = 0;		// The real fps (1000 / msf)
k.state.engine.loop = 0;		// The loop to redraw the screen

k.state.walk.indexPrev = 0;		// The position of our previous coördinates in our user object. Recalculated at startEngine
k.state.walk.indexNow = 1;		// The position of our current coördinates in our user object. Recalculated at startEngine
k.state.walk.indexNext = 2;		// The position of our next coördinates in our user object. Recalculated at startEngine

k.state.animation.sameframe = {};	// In order to correctly draw world-animated tiles we need to know if we're still on the same frame 

k.state.server.timedifference = 0;	// The difference between the time on the server and the client

k.links.echo;		// The echo div will be stored here as a jquery element
k.links.debug;		// The debug div will be stored here as a jquery element
k.links.canvas;		// The canvas reference will be made here

k.state.counter = 0;			// Every echoDebug() called will also print this time.

k.state.hud.layers = {};        // Layers that are currently DRAWN (This frame)

k.state.hud.openedDialogs = []; // Dialogs that are currently OPEN (Until closed)

k.state.server.completeget = 0;	// Have we gotten the entire message?


/**
 * Object for tilesets, maps, properties, ...
 */
k.collections.tilesets = [];		// All the tilesets are stored in this array
k.collections.animations = [];		// Animations can be put in this array (old school way - needs updating)
k.collections.tileproperties = {};	// Certain tiles have special properties, like they can be the beginning of an animation
k.collections.maps = {};
k.collections.objects = {}		// The variable that will contain all the objects, including the user's data
k.collections.hudLayers = {};

/**
 * The autotiles array
 * @define {array}
 */
k.collections.autotiles = [[5,  7,  5,  7,  13, 1,  13, 15],
                           [8,  6,  8,  6,  16, 2,  16, 14],
                           [17, 19, 17, 19, 9,  3,  9,  11],
                           [20, 18, 20, 18, 12, 4,  12, 10]];

/**
 * Extend the cache object
 */
k.cache.coord = {};
k.cache.coord.canvas = [];
k.cache.coord.mouse = [];
k.cache.coord.map = [];

/**
 * The map cache
 */
k.cache.map = {};

k.cache.autotile = {};

/**
 * A place to store cache flushing functions
 */
k.cache.clear = {};

/**
 * Clear the coordinations cache
 */
k.cache.clear.coord = function(){
	k.cache.coord.canvas = [];
	k.cache.coord.mouse = [];
	k.cache.coord.map = [];	
}

var tileSet = [];       // All the tilesets are stored in this array
var animation = [];
var animatedTiles = {}; // This array keeps a progress of animated tiles. The first level of tilesetnames are defined at loading
var animatedBegins = {};

var sameFrame = {};
var tileProperties = {};
var defaultSprites = 'default.tmx';	    // The map which holds the tiles for the objects and users and such.
					    // This map isn't actually useable, but this way we can use tiled to quickly edit tile preferences.

var ws;
var timeDifference = 0;	// The difference between the time on the server and the client


/**
 * The state of the keyboard
 */
k.state.keyboard = {
	
	/**
	 * How many frames have been skipped before finishing a certain keypress
	 * @define {integer}
	 */
	"skippedFrames": 0,
	
	"up": false,
	"down": false,
	"right": false,
	"left": false
};

var textObjects = [];		    // The variable that will store text messages
var charsPerLine = 52;		    // The ammount of letters that fit on one line
var userMoveTilePerSecond = 10;     // Tile per second
var userMoveSmoothness = 2;         // How smooth you want the character to move (0 - ?)
var userMoveQueue = 2;		    // How many moves we can queue up. Shouldn't be to much
var debugCounter;                   // Every echoDebug() called will also print this time.
var debugMovement = false;	    // output debug to the echo div on movement
var debugHudOn = true;		    // output debug to the echo div on HUD
var debugPathOn = false;            // Debug the pathfinding code?
var testPath = [];                  // An array with test pathfinding data

var loadHud = 'hud.json'	    // The URL of the HUD file we'll be loading
var hudLayers = {};		    // We'll store the HUD in here.
var previousHudLayers = {};	    // To determine wheter we've clicked on the HUD we need to know where they WERE.

// The default font setting, if no other default is set in hud.json
var font = {"size": 20,		    // Size in pixels
	"font": "monospace",    // Using anything but monospace would be stupid
	"hPadding": 5,
	"vPadding": 99,
	"width": 0.6,	    // The base width of a single character
	"height": 1.2,
	"orientation": "bottomleft",
	"dx": 5,
	"dy": 10};	    // The base height of a single character


/* @deprecated  */
var movie;

/**
 * Start the engine!
 * It does some basic setup and loading
 * After that it initiates the renderloop
 */
k.operations.startEngine = function() {
	
    // Link these output debug variables to the innerHTML content
    if (document.getElementById(k.settings.ids.DEBUG)) {
		k.links.debug = document.getElementById(k.settings.ids.DEBUG);
	}
	
    if (document.getElementById(k.settings.ids.ECHO)) {
		k.links.echo = document.getElementById(k.settings.ids.ECHO);
	}
	
	if (document.getElementById(k.settings.ids.FRAMEDEBUG)){
		k.links.framedebug = document.getElementById(k.settings.ids.FRAMEDEBUG);
	}

    // Start the debug counter
    k.state.counter = now();

    // Create a new canvas object
    k.links.canvas = new k.classes.Canvas(k.settings.ids.CANVAS);

	// Check for websocket
	if (!("WebSocket" in window)){
		echo('This browser does not support the HTML5 <b>WebSocket</b> protocol');
	}

    // Output an error if canvas hasn't loaded and exit
    if (!k.links.canvas.loaded) {
		echo('This browser does not support the HTML5 <b>Canvas</b> element');
		return;
	}
	
	// Calculate coördinate indexes
	k.state.walk.indexPrev = 0 + k.settings.debug.PATHHISTORY;
	k.state.walk.indexNow = 1 + k.settings.debug.PATHHISTORY;
	k.state.walk.indexNext = 2 + k.settings.debug.PATHHISTORY;
	k.state.walk.maxQueue = k.settings.walk.MAXQUEUE + k.state.walk.indexNow;
	
	window.onkeydown = k.operations.keyboard.onKeyDown;
    window.onkeyup = k.operations.keyboard.onKeyUp;

	// Already start the renderLoop for loading screens
	k.operations.renderLoop();
	
    // Connect to a server if it's required
    if(k.settings.server.CONNECT == true) {
		k.operations.getConnection();
    } else {
		// When it's not required, we must load all the maps and huds already
		// defined. Otherwise we'd get them from the server
		k.operations.load.getMaps(k.settings.engine.MAPS);
		
        // Temp object for coord calculation
		k.sel = {};
        k.sel.position = {};
        k.sel.position.x = 0;
        k.sel.position.y = 0;
		
    }
}

/**
 * Get a new map object
 * @returns	{k.Types.Object}
 */
k.links.createObject = function(id, x, y, mapname){
	
	var map = k.links.getMap(mapname);
	
	// Create an empty object
	var r = {};
	
	// Set the id
	r.id = id;
	
	// Create the position object
	r.position = {};
	
	// Set the x and y parameters
	r.position.x = x;
	r.position.zx = x;
	r.position.y = y;
	r.position.zy = y;
	
	// Set the map
	r.map = map;
	
	// Create fake previous steps
	var step = {
		time: {
			request: now() - k.settings.walk.msPerTile*3,
			begin: now() - k.settings.walk.msPerTile*2,
			end: now() - k.settings.walk.msPerTile
		},
		position: {
			x: x,
			y:y
		},
		properties: {
			walkable: true,
			speed: 100
		},
		state: {axis:""}
	};
		
	// Create a path array with fake 'previous' walks
	r.path = [step, step, step];
	
	r.tiles = ["m01"];
	
	// Set the state object
	r.state = {};
	
	// Link the tiles
	r.state.tiles = [k.links.getTileByChar("m01")];
	
	// Set default state objects
	r.state.ping = now();
	r.state.msMoved = now();
	r.state.axis = '';
	r.state.selected = [];
	
	return r;
}

/**
 * Get the tile object of a map object
 * @param	{k.Types.Object}	object
 * @returns	{k.Types.Tile}
 */
k.links.getObjectTile = function(object){
	
	return object.state.tiles[0];
}

/**
 * Get a map object
 * @param	{string}	mapname		The name of the map
 * @returns {k.Types.Map}			A map object
 */
k.links.getMap = function(mapname){
	return k.collections.maps[mapname];
}

/**
 * Get a layer object
 * @param	{String}	layername	The name of the layer
 * @param	{String}	[mapname]	The name of the map
 * @returns	{k.Types.mapLayer}		The layer object
 */
k.links.getLayer = function(layername, mapname){
	
	if(mapname === undefined) var map = k.links.canvas.map;
	else var map = k.links.getMap(mapname);
	
	if(map.layers[layername]['map'] === undefined)
		map.layers[layername]['map'] = map;
	
	return map.layers[layername];
	
}

/**
 * Get a certain sector
 * @param	{k.Types.CoordinatesClick}	coord
 * @param	{k.Types.mapLayer}			layer
 * @returns	{k.Types.Sector}
 */
k.links.getSector = function(coord, layer){

	var base = k.cache.map[layer.map.name][layer.name];
	
	if(base[coord.sec] === undefined) {
	
		var selement = document.createElement('canvas');
	
		// Set the resolution of the buffer element
		selement.width = layer.map.sectorWidth;
		selement.height = layer.map.sectorHeight;
	
		// Get the buffer context
		var sctx = selement.getContext('2d');
		
		base[coord.sec] = {
					element: selement,
					ctx: sctx,
					dirtyplace: 1,
					dirtycontent: 1,
					coord: coord,
					map: layer.map,
					layer: layer
				};
	} else {
		// Update the coord information!
		base[coord.sec]['coord'] = coord;
	}

	return base[coord.sec];
}

/**
 * Get a tile by its canvas position
 */
k.links.getTileByCanvas = function(canvasX, canvasY, layername, mapname){
	
	var coord = k.operations.coord.getByCanvas(canvasX, canvasY, mapname);
	
	return k.links.getTileByCoord(coord, layername, mapname);

}

/**
 * Get a tile by its map position
 */
k.links.getTileByMap = function(mapX, mapY, layername, mapname){
    
	var coord = k.operations.coord.getByMap(mapX, mapY, mapname);
    
    return k.links.getTileByCoord(coord, layername, mapname);
    
}

/**
 * Get a tile by its lexicographic order
 */
k.links.getTileByLex = function(lex, layername, mapname){
    	
	var coord = k.operations.coord.getByLex(lex, mapname);
	
	return k.links.getTileByCoord(coord, layername, mapname);
    
}

/**
 * Get a tile by its gid
 * @param	{integer}			gid			The GID of the tile
 * @param	{string}			mapname		What map it's on
 * @returns	{k.Types.Tile}
 */
k.links.getTileByGid = function(gid, mapname){
	
	/**
	 * The return object
	 * @type	{k.Types.tile}
	 */
	var r = {};
	
	r.tilegid = gid;
	
	// The tileset object
	r.tileset = k.collections.tilegid[mapname][r.tilegid];
	
	// Get the number of the tile on the tileset
	r.tilenr = r.tilegid - r.tileset.firstgid;
	
	// Get the properties of this tile
	r.properties = k.collections.tileproperties[r.tileset.name][r.tilegid] ||
				   {};
				   
	// Default settings
	r.dirty = true;
	r.coord = {};
	
	return r;
}

/**
 * Get a tile by its charname
 * @param   {string}    charname
 * @returns {k.Types.Tile}
 */
k.links.getTileByChar = function(charname){
    
    // If the char isn't found, return our naked char
    if(k.collections.chars[charname] === undefined){
        return k.links.getTileByGid(1, 'default.tmx');
    } else {
        return k.links.getTileByGid(k.collections.chars[charname], 'default.tmx');
    }
    
}

/**
 * Get a tile by its alias on this map
 * @param   {string}    alias
 * @param   {string}    mapname
 * @returns {k.Types.Tile}
 */
k.links.getTileByAlias = function(alias, mapname){
	
	if(mapname === undefined) mapname = k.links.canvas.map.name;
	
	var map = k.links.getMap(mapname);
    
    // If the char isn't found, return the first tile
    if(map.alias[alias] === undefined){
        return k.links.getTileByGid(1, mapname);
    } else {
        return k.links.getTileByGid(map.alias[alias], mapname);
    }
    
}

/**
 * Get a tile with the coord object already delivered
 * @param	{k.Types.CoordinatesClick}	coord		The coordinate of the map
 * @param	{string}					layername	The name of the layer
 * @param	{string}					mapname		What map it's on
 * @returns	{k.Types.Tile}
 */
k.links.getTileByCoord = function(coord, layername, mapname){
	
    if(mapname === undefined) var map = k.links.canvas.map;
	else var map = k.links.getMap(mapname);
	
	var layer = k.links.getLayer(layername);

    /**
	 * The return object
	 * @type	{k.Types.tile}
	 */
	var r = {};
	
	// Get the gid by the lexicographical order
	r.tilegid = layer.data[coord.lex];
	    
	if(r.tilegid > 0) {
		// The tileset object
		r.tileset = k.collections.tilegid[map.name][r.tilegid];
		
		// Get the number of the tile on the tileset
		r.tilenr = r.tilegid - r.tileset.firstgid;
		
		// Get the properties of this tile
		r.properties = k.collections.tileproperties[r.tileset.name][r.tilegid] ||
					   {};
		
	} else {
		
		// There's no tile here
		r.tileset = {};
		r.tilenr = 0;
		r.properties = {};
	}
	
	// Is this tile dirty?
	r.dirty=k.links.canvas.dirty.get.byCanvas(coord.canvasX, coord.canvasY);
	
	// The layer of this itle
	r.layer = k.links.getLayer(layername, mapname);
	
	// Set the coord of this tile on this map
	r.coord = coord;
    
    return r;
}

/**
 * Get a tile by its objectId
 */
k.links.getTileByObject = function(objectId){
	
	/**
	 * The return object
	 * @type	{k.Types.tile}
	 */
	var r = {};

}

/**
 * Get an animated object
 * @param	{string}	objectId	The id of the object
 * @returns	{k.Types.Object}		The object
 */
k.links.getObject = function(objectId){
	return k.collections.objects[objectId];
}

/**
 * Get the previous step of an object
 * @param	{k.Types.Object}	object	The user object
 * @returns	{k.Types.Pathstep}	The previous step
 */
k.links.step.getPrev = function(object){
	return object.path[object.path.length-1];
}

/**
 * Get a specific step of an object
 * @param	{k.Types.Object}	object	The user object
 * @param	{integer}			index	The index to get
 * @returns	{k.Types.Pathstep}	The previous step
 */
k.links.step.get = function(object, index){
	return object.path[index];
}

/**
 * Get the future step of an object
 * @param	{k.Types.Object}	object	The user object
 * @returns	{k.Types.Pathstep}	The previous step
 */
k.links.step.getNext = function(object){
	return object.path[k.state.walk.indexNext+1];
}

/**
 * Create a new step
 * @returns	{k.Types.Pathstep}
 */
k.links.step.create = function(x, y){
	return {
		
		time: {
			request: now(),
			begin: 0,
			end: 0
		},
		
		position: {
			x: x,
			y: y
		},
		
		properties: {
			walkable: false,
			speed: 100
		},
		
		state: {
			axis: "",
			requestSpeed: 0,
			wait: 0,
			gap: 0,
			direction: 0,
			sprite: "",
			nextTile: 0,
			change: 0,
			progress: 0
		}
	}
}

/**
 * Start the renderloop
 */
k.operations.renderLoop = function(){
	
	// Combine setInterval and requestAnimationFrame in order to get a desired fps
	k.state.engine.loop = setInterval("window.requestAnimFrame(k.operations.renderFrame)", 1000 / k.settings.engine.fps);

}

/**
 * Toggle the engine
 */
k.operations.toggleEngine = function(){
	if(k.state.engine.loop){
		clearInterval(k.state.engine.loop);
		k.state.engine.loop = false;
	} else {
		k.operations.renderLoop();
	}
}

/**
 * Determine if a tile is walkable
 * @param	mapName		{string}	The name of the map
 * @param	x		{integer}	The x tile we want
 * @param	y		{integer}	The y tile we want
 * @returns 			{integer}		Type of walkability
 */
k.operations.isTileWalkable = function(mapName, x, y){

	wantedTile = y * k.collections.maps[mapName]['width'] + x;

	// If the wantedtile is defined in the walkableTiles array it isn't walkable: return false.
	if(k.collections.maps[mapName]['walkableTiles'][wantedTile] !== undefined){
		return k.collections.maps[mapName]['walkableTiles'][wantedTile];
	}else {
		return 1;
	}
}

/**
 * Determine if a tile is out of bounds
 * @param	mapName		{string}	The name of the map
 * @param	x		{integer}	The x tile we want
 * @param	y		{integer}	The y tile we want
 * @returns 			{bool}		Yes or no
 */
k.operations.isTileInsideMap = function(mapName, x, y){

	// If the x and y is beyond the bounds of the map, return false
	if(y < 0 || y >= k.collections.maps[mapName]['height'] ||
	   x < 0 || x >= k.collections.maps[mapName]['width']) return false;

	return true;
}