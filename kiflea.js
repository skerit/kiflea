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

k = {settings:{debug:{}, server:{}, ids:{}, engine:{}, walk:{}},
   state:{engine:{}, load:{}, animation:{}, server:{}, output:{}, walk:{}, hud:{}},
   collections:{},
   classes:{},
   links:{},
   operations:{load:{}, walk:{}, interface:{}}};

/**
 * Do we want to enable debugging?
 * @define {boolean}
 */
k.settings.debug.DEBUG = true;

/**
 * show debug info on movement
 * @define {boolean}
 */
k.settings.debug.MOVEMENT = true;

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
 * Show debug info on pathfinding
 * @define {boolean}
 */
k.settings.debug.PATH = false;

/**
 * Debug grid width
 * @define {integer}
 */
k.settings.debug.GRIDWIDTH = 32;

/**
 * Debug grid height
 * @define {integer}
 */
k.settings.debug.GRIDHEIGHT = 32;

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

k.settings.engine.fps = 20; 				// The default desired Frames Per Second
k.settings.engine.background = 'rgb(255,255,255)' 	// The default background color
k.settings.engine.drawextras = 5;

k.settings.walk.MAXQUEUE = 2;       // The ammount of steps to queue
k.settings.walk.msPerTile = 200;    // The time it takes to move one tile (at normal speed)

/**
 * The map which holds the tiles for the objects and users and such.
 * This map isn't actually useable, but this way we can use tiled to quickly edit tile preferences.
 *  @define {string}
 */
k.settings.engine.DEFAULTSPRITES = 'default.tmx.xml';

/**
 * The url from where we'll be downloading the files
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
 * These values change during runtime
 */
k.state.connected = false;

k.state.recording = false;

k.state.load.toload = 0;		// Increases with each map/tileset that needs to be loaded
k.state.load.loaded = 0;		// Increases with each loaded map/tileset. Game will only start if they're equal
k.state.load.loadedHud = false;	// If the hud has been loaded
k.state.load.loadedMap = false;	// If the map has been loaded

k.state.engine.mappOffsetX = 0;		// The current offset of the map in relation to our user
k.state.engine.mappOffsetY = 0;
k.state.engine.msf = 0;			// The fake ms time (time it takes to start and end a draw)
k.state.engine.msr = 0;			// The real ms time (fake ms + time between draws)
k.state.engine.fpsf = 0;		// The fake fps (1000 / msf)
k.state.engine.fpsr = 0;		// The real fps (1000 / msf)

k.state.walk.indexPrev = 0;		// The position of our previous coördinates in our user object. Recalculated at startEngine
k.state.walk.indexNow = 1;		// The position of our current coördinates in our user object. Recalculated at startEngine
k.state.walk.indexNext = 2;		// The position of our next coördinates in our user object. Recalculated at startEngine

k.state.animation.sameframe = {};	// In order to correctly draw world-animated tiles we need to know if we're still on the same frame 

k.state.server.timedifference = 0;	// The difference between the time on the server and the client

k.links.echo;		// The echo div will be stored here as a jquery element
k.links.debug;		// The debug div will be stored here as a jquery element
k.links.canvas;		// The canvas reference will be made here

k.state.counter = 0;			// Every echoDebug() called will also print this time.
k.state.loopinterval = 0;		// The loopinterval for renderLoop()

k.state.hud.layers = {};        // Layers that are currently DRAWN (This frame)

k.state.hud.openedDialogs = []; // Dialogs that are currently OPEN (Until closed)


/**
 * Object for tilesets, maps, properties, ...
 */
k.collections.tilesets = [];		// All the tilesets are stored in this array
k.collections.animations = [];		// Animations can be put in this array (old school way - needs updating)
k.collections.tileproperties = {};	// Certain tiles have special properties, like they can be the beginning of an animation
k.collections.maps = {};
k.collections.objects = {}		// The variable that will contain all the objects, including the user's data
k.collections.hudLayers = {};

var fps = 30;


var mappOffsetX = 0;		// The current offset of the map in relation to our user
var mappOffsetY = 0;
var canvasId = 'flatearth';
var echoId = 'echo';            // The default id of the echo div
var debugId = 'debug';          // The default id of the debug div (for framerates)

var echoOutput;                 // The echo div will be stored here as a jquery element
var debugOutput;                // The debug div will be stored here as a jquery element
var debugOn = false;            // Enable or disable debugging
var msfTimer = 'N/A';   // When the last draw started
var msrTimer = 'N/A';   // When the last draw ended
var msf;                // The fake ms time (time it takes to start and end a draw)
var msr;
var fpsf;
var fpsr;
var tileSet = [];       // All the tilesets are stored in this array
var animation = [];
var animatedTiles = {}; // This array keeps a progress of animated tiles. The first level of tilesetnames are defined at loading
var sameFrame = {};
var tileProperties = {};
var toLoad = 0;
var loaded = 0;
var backgroundColor = "rgb(255,255,255)";   // The colour outside of the map. Should be moved to the map itself.
var defaultSprites = 'default.tmx.xml';	    // The map which holds the tiles for the objects and users and such.
					    // This map isn't actually useable, but this way we can use tiled to quickly edit tile preferences.
var loadMaps = ['map.tmx.xml', defaultSprites];             // All the mapfiles that need to be loaded (tilesets are defined in the map files)
var maps = {};          // An array that stores the data of all the maps
var visibleTilesX;      // The ammount of tiles visible per row (should be deprecated)
var visibleTilesY;      // The ammount of tiles visible per col (should be deprecated)
var loopInterval = 0;
var ws;
var timeDifference = 0;	// The difference between the time on the server and the client
// Normally you only want to draw what you can see (that's logic)
// But since this engine supports multiple tile sizes in one world it's sometimes
// necesarry to draw outside those bounds.
var drawExtras = 5;
var keyFake = {		// Keypresses are handled in an annoying way.
	"ms": 0,
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
	"map": "grassland.tmx.xml", // In what map is the user?
	"sprites": {
		"stand": 493 	// what sprites to use for walking (the rest are defined in tiled)
	},
	"currentSprite": 493 // the current sprite to use
	};

var animatedObjects = {};	    // The variable that will contain all the objects, including the user's data
var textObjects = [];		    // The variable that will store text messages
var charsPerLine = 52;		    // The ammount of letters that fit on one line
var userSpawnX = 10;                // The X position our user starts at
var userSpawnY = 10;                // The Y position our user starts at
var userMoveTilePerSecond = 10;     // Tile per second
var userMoveMsPerTile = 100;        // MS per tile (one of these has to go)
var userMoveSmoothness = 2;         // How smooth you want the character to move (0 - ?)
var userMoveQueue = 2;		    // How many moves we can queue up. Shouldn't be to much
var debugCounter;                   // Every echoDebug() called will also print this time.
var debugMovement = false;	    // output debug to the echo div on movement
var debugHudOn = true;		    // output debug to the echo div on HUD
var debugGrid = false;              // Do you want to draw a grid on the canvas?
var debugPathOn = false;            // Debug the pathfinding code?
var testPath = [];                  // An array with test pathfinding data
var debugGridX = 32;
var debugGridY = 32;

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
 * Enables or disables the engine
 */
k.operations.toggleEngine = function(){

	if(loopInterval === undefined){

		k.links.echo.empty();           // Clear the echo div
		k.operations.startEngine();     // Start the engine

	}else {

		// Output a stopping message
		debugEcho('<h2 style="color:red;">The engine has stopped!</h2><hr>');

		// Clear the timer
		k.state.loopinterval = window.clearInterval(k.state.loopinterval);
	}
}

/**
 * Initialize a canvas element
 * @classDescription  This class creates a new canvas.
 * @param  {string}   canvasId  The id of the canvas to load
 * @return {object}   Return our own Canvas element
 * @constructor
 */
k.classes.Canvas = function(canvasId){

	var that = this;
	this.canvasId = canvasId;

	// Retrieve the canvas DOM node, this gives us access to its drawing functions
	this.ctx = document.getElementById(canvasId).getContext('2d');

	// Get the width and height of the element
	this.width = document.getElementById(canvasId).width;
	this.height = document.getElementById(canvasId).height;

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

	});

	// Now check if we actually have a canvas object.
	// If we don't, this browser doesn't support it
	if(this.ctx) {
		this.loaded = true;
		debugEcho('Canvas has been initialized');
	} else {
		this.loaded = false;
	}

}

/**
 * Start the engine!
 * It does some basic setup and loading
 * After that it initiates the renderloop
 */
k.operations.startEngine = function() {
	
	// The return variable
	result = '';

    // Setup the output divs as referrable jquery items
    k.links.debug = $('#' + k.settings.ids.DEBUG);
    k.links.echo = $('#' + k.settings.ids.ECHO);

    // Start the debug counter
    k.state.counter = now();

    // Create a new canvas object
    k.links.canvas = new k.classes.Canvas(k.settings.ids.CANVAS);

    // Output an error if canvas hasn't loaded
    if (!k.links.canvas.loaded) {
        echo('Canvas is not available in this browser!');
    }

	// Calculate coördinate indexes
	k.state.walk.indexPrev = 0 + k.settings.debug.PATHHISTORY;
	k.state.walk.indexNow = 1 + k.settings.debug.PATHHISTORY;
	k.state.walk.indexNext = 2 + k.settings.debug.PATHHISTORY;
	k.state.walk.maxQueue = k.settings.walk.MAXQUEUE + k.state.walk.indexNow;

	k.operations.load.getHud();
	
	if ("WebSocket" in window){
		result = result + ' - Websockets found';
	} else {
		result = result + ' - Websockets NOT found';
	}

    // Connect to a server if it's required
    if(k.settings.server.CONNECT == true) {
		getConnection();
    } else {

		// When it's not required, we must load all the maps and huds already
		// defined. Otherwise we'd get them from the server
		k.operations.load.getMaps(loadMaps);
		k.operations.load.getHud();

		k.operations.startLoop();
    }

    window.onkeydown = onKeyDown;
    window.onkeyup = onKeyUp;

    // Set focus to the dummyInput!
    $("#dummyinput").focus();
	
	return result;

}

/**
 * Start the renderloop
 */
k.operations.startLoop = function(){
    k.state.loopinterval = window.setInterval("renderLoop()", 1000 / k.settings.engine.fps );
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
            dataType: "xml",
            async: false, // Important: when this is turned on it will let the loop continue and change the currentMap. Causing every map to be stored under the same name
            success: function(xml, textStatus, error){
		k.operations.load.processMap(xml, currentMap)
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

	//Save the attributes of the map element
        oneMap['width'] = $(this).attr('width');
        oneMap['height'] = $(this).attr('height');
        oneMap['tileWidth'] = $(this).attr('tilewidth');
        oneMap['tileHeight'] = $(this).attr('tileheight');

        debugEcho('Create an array for all the layers', false);

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
			firstGid	// The beginning id of the tileset
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
        maps[sourcename] = oneMap;

        loaded++;

    });

}

/**
 *Determine what tiles (coordinates) can be walked on in a map
 *@param 	sourcename		{string}	The name of the map
 */
k.operations.load.getWalkableTiles = function(sourcename){

    var oneMap = maps[sourcename];

    // Create an array we'll fill up and return later
    var walkableTiles = [];

    // Calculate the total ammount of tiles on each layer
    var totalTileAmmount = oneMap['width'] * oneMap['height'];

    // Loop through the layers
    for(var layerName in oneMap['layers']){

	// Loop through every tile in this layer
	for(var pos = 0; pos < totalTileAmmount; pos++){
	//debugEcho('Loop through the tiles ' + pos);

	    if(oneMap['layers'][layerName]['data'][pos] !== undefined){

		// Get the number of the tile from the tileset to use
		var tileNumber = oneMap['layers'][layerName]['data'][pos];

		// what tileset is this from?
		var tileSetInfo = getTileSetInfo(sourcename, tileNumber);

		if(tileSetInfo !== undefined){
		    // Get the name of the tileset out of the returned array
		    var tileSetName = tileSetInfo['tileSetName'];

		    if(tileProperties[tileSetName][tileNumber] !== undefined){
			if(tileProperties[tileSetName][tileNumber]['impenetrable'] !== undefined){
			    walkableTiles[pos] = 0; // It's much more logical to set "walkable" to 0
			}

		    }
		}

	    }
	}
    };

    debugEcho('Return walkable tiles for map ' + sourcename);
    return walkableTiles;
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
	if(y < 0 || y >= maps[animatedObjects[userPosition.uid]['map']]['height'] || x < 0 || x >= maps[animatedObjects[userPosition.uid]['map']]['width']) return false;

	wantedTile = y * maps[mapName]['width'] + x;

	// If the wantedtile is defined in the walkableTiles array it isn't walkable: return false.
	if(maps[mapName]['walkableTiles'][wantedTile] !== undefined){
		return false;
	}else {
		return true;
	}
}

/**
 *Process and save a tileset
 *@param    source          {string}    The url of the tileset
 *@param    storeAsName     {string}    The name of the tileset
 *@param    imageTileWidth  {int}       The width of a tile in this tileset
 *@param    imageTileHeight {int}       The height of a tile in this tileset
 *@param    startGid        {int}       The starting number of this tileset
 *(Tileset 1 holds tile 1 to 10, tileset 2 holds 11 to 20, so its startGid is 11)
 */
k.operations.load.loadTileSet = function(source, storeAsName, imageTileWidth, imageTileHeight, startGid) {

    // Increase the "toLoad" waiting count
    toLoad++;

    // Create a new image variable where we'll load the image in.
    var img = new Image();

    // When the image has been downloaded we can execute these functions
    img.onload = (function () {

        // Calculate the tilesPerRow
        var tilesPerRow = Math.floor(img.width / imageTileWidth);
        var tilesPerCol = Math.floor(img.height / imageTileHeight);
        var totalTiles = tilesPerCol * tilesPerRow;

        tileSet[storeAsName] = {
            "image": img,
            "tileWidth": imageTileWidth,
            "tileHeight": imageTileHeight,
            "tpr": tilesPerRow,
            "tpc": tilesPerCol,
            "total":totalTiles,
            "firstgid": startGid
        };

        loaded++; // Increase our loaded counter

        debugEcho('tileset image"' + source + '" has been downloaded', false);
    });

    // Start downloading the source.
    img.src = k.settings.engine.BASEURL + source

    debugEcho('tileset "' + source + '" has been loaded as "' + storeAsName + '"', false);
}


