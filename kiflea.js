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

var fps = 30;                   // The default desired Frames Per Second
var defaultTileWidth = 32;      // The default tileWidth. Deprecated
var defaultTileHeight = 32;     // The default tileHeight. Deprecated
var defaultTilesPerRow = 16;    // The default tiles per row. Deprecated
var canvasId = 'flatearth';     // The default id of the canvas element.
var echoId = 'echo';            // The default id of the echo div
var debugId = 'debug';          // The default id of the debug div (for framerates)
var echoOutput;                 // The echo div will be stored here as a jquery element
var debugOutput;                // The debug div will be stored here as a jquery element
var debugOn = false;            // Enable or disable debugging
var msfTimer = 'N/A';   // When the last draw started
var msrTimer = 'N/A';   // When the last draw ended
var msf;                // The fake ms time (time it takes to start and end a draw)
var msr;                // The real ms time (fake ms + time between draws)
var fpsf;               // The fake fps (1000 / msf)
var fpsr;               // The real fps (1000 / msf)
var tileSet = [];       // All the tilesets are stored in this array
var animation = [];     // Animations can be put in this array (old school way - needs updating)
var animatedTiles = {}; // This array keeps a progress of animated tiles. The first level of tilesetnames are defined at loading
var sameFrame = {};	// In order to correctly draw world-animated tiles we need to know if we're still on the same frame 
var tileProperties = {};// Certain tiles have special properties, like they can be the beginning of an animation
var toLoad = 0;         // Increases with each map/tileset that needs to be loaded
var loaded = 0;         // Increases with each loaded map/tileset. Game will only start if they're equal
var backgroundColor = "rgb(255,255,255)";   // The colour outside of the map. Should be moved to the map itself.
var defaultSprites = 'default.tmx.xml';	    // The map which holds the tiles for the objects and users and such.
					    // This map isn't actually useable, but this way we can use tiled to quickly edit tile preferences.
var loadMaps = ['map.tmx.xml', defaultSprites];             // All the mapfiles that need to be loaded (tilesets are defined in the map files)
var maps = {};          // An array that stores the data of all the maps
var visibleTilesX;      // The ammount of tiles visible per row (should be deprecated)
var visibleTilesY;      // The ammount of tiles visible per col (should be deprecated)
var loopInterval = 0;

// Normally you only want to draw what you can see (that's logic)
// But since this engine supports multiple tile sizes in one world it's sometimes
// necesarry to draw outside those bounds.
var drawExtras = 5;

// Data on the whereabouts of our user (This variable will be scaled down, as most of its data will be put in the objects variable)
var userPosition = {
    "uid": "U00001",	// The userid (and object id)
    "x": 0, 		// Where is the user currently
    "y": 0,
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
var debugHudOn = false;		    // output debug to the echo div on HUD
var debugGrid = false;              // Do you want to draw a grid on the canvas?
var debugGridX = 32;
var debugGridY = 32;

var loadHud = 'hud.json'	    // The URL of the HUD file we'll be loading
var hudLayers = {};		    // We'll store the HUD in here.
var previousHudLayers = {};	    // To determine wheter we've clicked on the HUD we need to know where they WERE.

/**
 *Enables or disables the engine
 */
function toggleEngine(){
    
    if(loopInterval === undefined){
	
	// Output a starting message
	echoOutput.empty();
	debugEcho('<h3 style="color:green;">The engine is being started!</h3><hr>');
	startEngine();
	
    }else {
	
	// Output a stopping message
	debugEcho('<h3 style="color:red;">The engine has stopped!</h3><hr>');
	
	// Clear the timer
        loopInterval = window.clearInterval(loopInterval);
    }
}

/**
 *Start the engine!
 *It does some basic setup and loading
 *After that it initiates the renderloop
 */
function startEngine() {
    
    // Setup the output divs as referrable jquery items
    debugOutput = $('#'+debugId);
    echoOutput = $('#'+echoId);
    
    // Start the debug counter
    debugCounter = now();

    // Retrieve the canvas DOM node, this gives us access to its drawing functions
    ctx = document.getElementById(canvasId).getContext('2d');
    
    // If we've succesfully setup ctx, initialize a few variables
    if (ctx) {
        canvasWidth = document.getElementById(canvasId).width;
        canvasHeight = document.getElementById(canvasId).height;
        visibleTilesX = canvasWidth / defaultTileWidth;
        visibleTilesY = canvasHeight / defaultTileHeight;
    } else {
        // Canvas not available!
        echo('Canvas is not available in this browser!');
    }
    
    debugEcho('Canvas has been initialized');
    
    // Load the maps and their tilesets
    getMaps();
    
    // Load the HUD
    getHud();
    
    // Bind key functions
    window.onkeydown = onKeyDown;
    //window.onkeyup = onKeyUp;
    //window.onblur = OnBlur;
    //window.onfocus = OnFocus;
    jQuery(document).ready(function(){
       $('#'+canvasId).click(function(e){
	  //alert(e.pageX +', '+ e.pageY);
	  onMouseclick(e.pageX-this.offsetLeft, e.pageY-this.offsetTop);
       }); 
    })
    
    // Set focus to the dummyInput!
    $("#dummyinput").focus();
    
    // Start the renderloop!
    loopInterval = window.setInterval("renderLoop()", 1000 / fps);

}

/**
 *  Load all the maps in the "loadMaps" variable array.
 *  Process them, and their tilesets!
 */
function getMaps(){

    debugEcho('Loading specified maps', false);
    
    toLoad = loadMaps.length;

    for (var i = 0; i < loadMaps.length; i++){
        
        // We have to store the current name in a variable because before the
	// successcommand has fired i will already be incremented.
        var currentMap = loadMaps[i];
        
        $.ajax({
          type: "GET",
          url: currentMap,
          dataType: "xml",
	  async: false, // Important: when this is turned on it will let the loop continue and change the currentMap. Causing every map to be stored under the same name
          success: function(xml, textStatus, error){
            processMap(xml, currentMap)
          }
        });
    }
    
    debugEcho('Ending getMaps() function -- processing still in progress');
}


/**
 *  Process a map and his tilesets!
 */
function processMap(xml, sourcename) {
    
    
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
	    
	    // Now iterate through all the properties.
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
	    
            loadTileSet(
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
		
		// Store all the properties in tileProperties array
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
function getWalkableTiles(sourcename){
    
    oneMap = maps[sourcename];
    
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
function isTileWalkable(mapName, x, y){
    wantedTile = y * maps[mapName]['width'] + x;
    if(maps[mapName]['walkableTiles'][wantedTile] !== undefined){
        debugMove('We\'ve hit an unwalkable tile');
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
function loadTileSet(source, storeAsName, imageTileWidth, imageTileHeight, startGid) {
    
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
    img.src = source
    
    debugEcho('tileset "' + source + '" has been loaded as "' + storeAsName + '"', false);
}


