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
		keyboard:{}
	},
	
	collections:{tilegid: {}},
	classes:{},
	links:{},
   
	operations:{
		server:{},
		load:{},
		walk:{},
		interface:{},
		keyboard:{},
		coord:{},
		render:{}
	},
	
	events: {},
	actions: {},
	cache: {}
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
k.settings.engine.fps = 25;

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

var fps = 10;


var mappOffsetX = 0;		// The current offset of the map in relation to our user
var mappOffsetY = 0;

var tileSet = [];       // All the tilesets are stored in this array
var animation = [];
var animatedTiles = {}; // This array keeps a progress of animated tiles. The first level of tilesetnames are defined at loading
var animatedBegins = {};

var sameFrame = {};
var tileProperties = {};
var defaultSprites = 'default.tmx';	    // The map which holds the tiles for the objects and users and such.
					    // This map isn't actually useable, but this way we can use tiled to quickly edit tile preferences.

var visibleTilesX;      // The ammount of tiles visible per row (should be deprecated)
var visibleTilesY;      // The ammount of tiles visible per col (should be deprecated)
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

// Data on the whereabouts of our user (This variable will be scaled down, as most of its data will be put in the objects variable)
var userPosition = {
	"uid": "U"+ rand(100000),	// The userid (and object id)
	"moveToX": 0, 	// Where is the user going?
	"moveToY": 0,
	"fromX": 0,
	"fromY": 0,
	"msMoved": 100, 	// How many ms have we spent on this move?
	"lastMoved": 1000, 	// when did the user last moved?
	"map": "template.tmx", // In what map is the user?
	"sprites": {
		"stand": 493 	// what sprites to use for walking (the rest are defined in tiled)
	},
	"currentSprite": 493 // the current sprite to use
	};

var animatedObjects = {};	    // The variable that will contain all the objects, including the user's data
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
var mouseX = 0;
var mouseY = 0;

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
		
		userPosition.uid = "U00001";
		
		animatedObjects[userPosition.uid] = {
				"uid": userPosition.uid,
				"moveToX": 30,
				"moveToY": 31,
				"fromX": 30,
				"fromY": 31,
				"msMoved": 100,
				"lastMoved": 1000,
				"map": "template.tmx",
				"sprites": [1, 21],
				"spritesToDraw": [1, 21], 
				"currentSprite": 1,
				"effects": [],
				"selection": 0,
				"currenthealth": 55,
				"fullhealth": 100,
				"path": [{moveBegin: 100, moveEnd: 200, walkable: true, terrainSpeed: 1, timeRequested: 100, x: 9, y: 10},
						 {moveBegin: now()-200, moveEnd: now()-100, walkable: true, terrainSpeed: 1, timeRequested: 100, x: 9, y: 13},
						 {moveBegin: now()-100, moveEnd: now(), walkable: true, terrainSpeed: 1, timeRequested: 100, x: 9, y: 13}],
				"actionsreceived": [],
				"finishedEvents": {},
				"position": {"x": 9, "y": 13}
			};
		
    }
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
	
	return map.layers[layername];
	
}

/**
 * Get a tile by its canvas position
 */
k.links.getTileByCanvas = function(canvasX, canvasY, layername, mapname){
	
	if(mapname === undefined) var map = k.links.canvas.map;
	else var map = k.links.getMap(mapname);
	
	var layer = k.links.getLayer(layername);
	var coord = k.operations.coord.getByCanvas(canvasX, canvasY, mapname);
	
	/**
	 * The return object
	 * @type	{k.Types.tile}
	 */
	var ret = {};
	
	// Get the gid by the lexicographical order
	ret.tilegid = layer.data[coord.lex];
	
	
	
	
}

/**
 * Get an animated object
 * @param	{string}	objectId	The id of the object
 * @returns	{k.Types.Object}		The object
 */
k.links.getObject = function(objectId){
	return animatedObjects[objectId];
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
 * Download all the specified maps.
 * After downloading, process them.
 * @param	{array}		loadMaps	The array of maps to load
 */
k.operations.load.getMaps = function(loadMaps){

    debugEcho('Loading specified maps', false);

    // Increment the "toload" variable. This variable has to equal
    // the "loaded" variable in order for the renderLoop() to draw something.
    k.state.load.toload += loadMaps.length;

    for (var i = 0; i < loadMaps.length; i++){

        // We have to store the current name in a variable because before the
        // successcommand has fired i will already be incremented.
        var currentMap = loadMaps[i];

        $.ajax({
            type: "GET",
            url: k.settings.engine.BASEURL + currentMap,
            dataType: "text xml",
            async: false,
            success: function(xml, textStatus, jqXHR){
				//k.operations.load.processMap(xml, right(jqXHR['responseXML']['URL'], "/"));
				k.operations.load.processMap(xml, currentMap);
          }
        });
    }

    debugEcho('Ending getMaps() function -- processing still in progress');
}

/**
 * Process a map and its tilesets
 * @param	{string}	xml		The xml data to process
 * @param	{string}	sourcename	The name of the xml
 */
k.operations.load.processMap = function(xml, sourcename) {

    debugEcho('Processing "<b>' + sourcename + '</b>" map', false);
	
    // Temporary storage array
    var oneMap = {};

    // Now iterate every map element (should only be one in every file)
    $(xml).find('map').each(function(){
		
		console.log('Found map in ' + sourcename);

		//Save the attributes of the map element
		oneMap['width'] = parseInt($(this).attr('width'));
		oneMap['height'] = parseInt($(this).attr('height'));
		oneMap['tileWidth'] = parseInt($(this).attr('tilewidth'));
		oneMap['tileHeight'] = parseInt($(this).attr('tileheight'));
	
		debugEcho(sourcename + ' - Create an array for all the layers', false);
	
		// Create an array to store all the events in
		oneMap['events'] = {};
		oneMap['properties'] = {};
	
		// Itterate through all the properties of this MAP
		$(this).find('properties').find('property').each(function(){
			oneMap['properties'][$(this).attr('name')] = $(this).attr('value');
		});
	
		// Iterate through every objectgroup
		$(this).find('objectgroup').each(function(){
	
			// Now iterate through all the objects.
			$(this).find('object').each(function(){
	
				var beginX = Math.floor($(this).attr('x') / oneMap['tileWidth']);
				var beginY = Math.floor($(this).attr('y') / oneMap['tileHeight']);
				var endX = beginX + Math.floor($(this).attr('width') / oneMap['tileWidth']);
				var endY = beginY + Math.floor($(this).attr('height') / oneMap['tileHeight']);
				var eventName = $(this).attr('name');
				var eventType = $(this).attr('type');
				var eventProperties = {};
		
				eventProperties['name'] = eventName;
				eventProperties['type'] = eventType;
				eventProperties['action'] = eventType;
		
				// Now iterate through all the properties.
				$(this).find('properties').find('property').each(function(){
					eventProperties[$(this).attr('name')] = $(this).attr('value');
				});
		
				// Store these events in every tile it's on.
				for(var countY = beginY; countY < endY; countY++){
					for(var countX = beginX; countX < endX; countX++){
					var currentTile = ((countY+1) * oneMap['width']) + countX+1;
		
					if(oneMap['events'][currentTile] === undefined){
						oneMap['events'][currentTile] = [];
					};
		
					// Store the event in the array
					oneMap['events'][currentTile].push(eventProperties);
		
					}
				}
	
			});
	
		});
	
		// Create an array to store all this world's layers in
		oneMap['layers'] = {};
	
		// Iterate through every layer
		$(this).find('layer').each(function(){
	
			// The content of the <data> element is base64 encoded
			// This modified function will decode it and return a proper array
			mapData = base64_decode_map($(this).find('data').text());
		
			// Certain layers have properties. Create another temporary array
			// to store them in.
			var properties = {};
		
			// Now iterate through all the properties of this layer.
			$(this).find('properties').find('property').each(function(){
				properties[$(this).attr('name')] = $(this).attr('value');
			});
		
			oneMap['layers'][$(this).attr('name')] = {
				'data': mapData,
				'name': $(this).attr('name'),
				'width': $(this).attr('width'),
				'height': $(this).attr('height'),
				'opacity': $(this).attr('opacity'),
				'properties': properties
			};
	
		});
	
		// Create an array for all the tilesets
		oneMap['tilesets'] = {};
	
		debugEcho('Map "<b>' + sourcename + '</b>" has been processed');
		debugEcho('Loading "<b>' + sourcename + '</b>" tilesets', false);
	
		// Load all the tilesets
		$(this).find('tileset').each(function(){
	
			var tileSetName = $(this).attr('name');
			var firstGid = $(this).attr('firstgid');
	
			// Store the tileset info in the temporary oneMap variable
				oneMap['tilesets'][tileSetName] = {
			'name': tileSetName,
			'source': $(this).find('image').attr('source'),
			'tileWidth': $(this).attr('tilewidth'),
			'tileHeight': $(this).attr('tileheight'),
			'firstgid': firstGid
			};
	
			k.operations.load.loadTileSet(
				$(this).find('image').attr('source'),	// The url of the tileset (the source in the xml)
				tileSetName, 			// The name of the tileset
				$(this).attr('tilewidth'),	// The width of one tile
				$(this).attr('tileheight'),	// The height of one tile
				firstGid,	// The beginning id of the tileset
				sourcename	// The map name
			);
	
			// Add new tileSet to the tileProperties array
			tileProperties[tileSetName] = {};
	
			// Add new tileset to the animatedTiles array
			animatedTiles[tileSetName] = {};
	
			// Create a temporary array to store this tileset's properties in
			var tempProperties = {};
	
			// Load through every tile that has a special property
			$(this).find('tile').each(function(){
	
			// Calculate the ID of this tile (they're stored starting with 0, not with their firstgid)
			var tileGid = parseInt(firstGid) + parseInt($(this).attr('id'));
	
			// Loop through each property and save it in the temporary array
			$(this).find('property').each(function(){
	
				// Save the name and value in a variable, to make our code prettier to read
				var propertyName = $(this).attr('name');
				var propertyValue = $(this).attr('value');
	
				// Look at the name of the given property, and do things accordingly
				switch(propertyName) {
				// We define nextframes in tiled according to their order in THAT tileset
				// We don't use tilegids there because these can change as new tilesets are
				// added or removed.
				case 'nextframe':
				  tempProperties[propertyName] = parseInt(propertyValue) + parseInt(firstGid-1);
				  break;
	
				// If it's none of the above, just save the value as is
				default:
				  tempProperties[propertyName] = propertyValue;
				}
	
			});
	
			// Store all the properties of this tile in tileProperties array
			tileProperties[tileSetName][tileGid] = tempProperties;
			tempProperties = {};
			});
	
		});
	
		// Initiate the walkableTiles object, filled later (after tilesets have loaded)
		oneMap['walkableTiles'] = [];
	
		// Now store this map in the global maps variable
		k.collections.maps[sourcename] = oneMap;
		
		k.state.load.loaded++;

    });

}

/**
 * Determine what tiles (coordinates) can be walked on in a map, and directly
 * store it in that map
 * @param 	sourcename		{string}	The name of the map
 */
k.operations.load.loadWalkableTiles = function(sourcename){
	
	var get =  k.operations.load.getWalkableTiles(sourcename);
	
	console.log(get);
	
    k.collections.maps[sourcename]['walkableTiles'] = get.walkableTiles;
	k.collections.maps[sourcename]['shadowTiles'] = get.shadowTiles;
}

/**
 * Determine what tiles (coordinates) can be walked on in a map
 * @param 	sourcename		{string}	The name of the map
 */
k.operations.load.getWalkableTiles = function(sourcename){

    // Get the map object
    var map = k.links.getMap(sourcename);
    
    // Create an array we'll fill up and return later
    var walkableTiles = [];
	
	// Shadows
	var shadowTiles = [];

    // Calculate the total ammount of tiles on each layer
    var totalTileAmmount = map.width * map.height;

    // Loop through the layers
    for(var layerName in map.layers){

        // Loop through every tile in this layer
        for(var pos = 0; pos < totalTileAmmount; pos++){
    
            if(map.layers[layerName]['data'][pos] !== undefined){
    
                // Get the number of the tile from the tileset to use
                var tileNumber = map.layers[layerName]['data'][pos];
        
                // what tileset is this from?
                var tileSetInfo = getTileSetInfo(sourcename, tileNumber);
        
                if(tileSetInfo !== undefined){
                    // Get the name of the tileset out of the returned array
                    var tileSetName = tileSetInfo['tileSetName'];
        
                    if(tileProperties[tileSetName][tileNumber] !== undefined){
                        if(tileProperties[tileSetName][tileNumber]['impenetrable'] !== undefined){
                            walkableTiles[pos] = 0; // It's much more logical to set "walkable" to 0
                        }
						
						if(tileProperties[tileSetName][tileNumber]['shadow'] !== undefined){
							
							// Get the coordinates by the lex value
							var coord = k.operations.coord.getByLex(pos, sourcename);
							
							// Increase the x
							coord.mapX++;
							
							console.log('Setting shadow for ' + coord.mapX);

							// Get the new lex if it's still on the map
							if(coord.mapX <= map.width){
								
								var newc = k.operations.coord.getByMap(coord.mapX, coord.mapY, sourcename);
								
								// Only draw a shadow if the tile is different
								if(map.layers[layerName]['data'][pos] != map.layers[layerName]['data'][newc.lex])
									shadowTiles[newc.lex] = tileProperties[tileSetName][tileNumber]['shadow'];
							}
                        }
                    }
                }
            }
        }
    };

    debugEcho('Return walkable tiles for map ' + sourcename);
    return {'walkableTiles': walkableTiles, 'shadowTiles': shadowTiles};
}

/**
 *Determine if a tile is walkable
 *@param	mapName		{string}	The name of the map
 *@param	x		{integer}	The x tile we want
 *@param	y		{integer}	The y tile we want
 *@returns 			{bool}		Yes or no
 */
k.operations.isTileWalkable = function(mapName, x, y){

	// If the x and y is beyond the bounds of the map, return false
	if(y < 0 || y >= k.collections.maps[animatedObjects[userPosition.uid]['map']]['height'] ||
	   x < 0 || x >= k.collections.maps[animatedObjects[userPosition.uid]['map']]['width']) return false;

	wantedTile = y * k.collections.maps[mapName]['width'] + x;

	// If the wantedtile is defined in the walkableTiles array it isn't walkable: return false.
	if(k.collections.maps[mapName]['walkableTiles'][wantedTile] !== undefined){
		return false;
	}else {
		return true;
	}
}

/**
 * Process and save a tileset
 * @param    source          {string}    The url of the tileset
 * @param    storeAsName     {string}    The name of the tileset
 * @param    imageTileWidth  {int}       The width of a tile in this tileset
 * @param    imageTileHeight {int}       The height of a tile in this tileset
 * @param    startGid        {int}       The starting number of this tileset
 */
k.operations.load.loadTileSet = function(source, storeAsName, imageTileWidth,
                                         imageTileHeight, startGid, mapname) {

    // Increase the "toLoad" waiting count
    k.state.load.toload++;
    k.state.load.toloadTilesets++;

    // Create a new image variable where we'll load the image in.
    var img = new Image();

    // When the image has been downloaded we can execute these functions
    img.onload = (function () {

        // Calculate the tilesPerRow
        var tilesPerRow = Math.floor(img.width / imageTileWidth);
        var tilesPerCol = Math.floor(img.height / imageTileHeight);
        var totalTiles = tilesPerCol * tilesPerRow;
		startGid = parseInt(startGid);

        tileSet[storeAsName] = {
            "image": img,
            "tileWidth": imageTileWidth,
            "tileHeight": imageTileHeight,
            "tpr": tilesPerRow,
            "tpc": tilesPerCol,
            "total":totalTiles,
            "firstgid": startGid
        };
		
		if(k.collections.tilegid[mapname] === undefined)
			k.collections.tilegid[mapname] = [];
		
		// Store it in the tilegid collection, as a map to the tileset
		for(var t = 0; t < totalTiles; t++){
			
			var gid = t + startGid;
			
			k.collections.tilegid[mapname][gid] = tileSet[storeAsName];
			
		}
		
		// Make an entrance in the animatedBegins object
		animatedBegins[storeAsName] = {};

        // Increase the loaded counters
        k.state.load.loaded++;
        k.state.load.loadedTilesets++;
        
        // If all the tilesets have loaded, process the walkabletiles
        if(k.state.load.loadedTilesets == k.state.load.toloadTilesets){
            for(map in k.collections.maps)
                k.operations.load.loadWalkableTiles(map);
        }

        debugEcho('tileset image"' + source + '" has been downloaded', false);
    });

    // Start downloading the source.
    img.src = k.settings.engine.BASEURL + source

    debugEcho('tileset "' + source + '" has been loaded as "'
              + storeAsName + '"', false);
}


