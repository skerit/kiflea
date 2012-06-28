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
		
		//Save the attributes of the map element
		oneMap['width'] = parseInt($(this).attr('width'));
		oneMap['height'] = parseInt($(this).attr('height'));
		oneMap['tileWidth'] = parseInt($(this).attr('tilewidth'));
		oneMap['tileHeight'] = parseInt($(this).attr('tileheight'));
		oneMap['pixelWidth'] = oneMap['width'] * oneMap['tileWidth'];
		oneMap['pixelHeight'] = oneMap['height'] * oneMap['tileHeight'];
		oneMap['sectorWidth'] = k.settings.engine.SECTORSIZE * oneMap['tileWidth'];
		oneMap['sectorHeight'] = k.settings.engine.SECTORSIZE * oneMap['tileHeight'];
		oneMap['tpr'] = oneMap['width'];
		oneMap['tpc'] = oneMap['height'];
		oneMap['spr'] = oneMap['width'] / k.settings.engine.SECTORSIZE;
		oneMap['spc'] = oneMap['height'] / k.settings.engine.SECTORSIZE;
		oneMap['name'] = sourcename;
		oneMap['alias'] = {};
		
		// Create the object state array
		k.state.position[sourcename] = {};
	
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
		
		// Keep the layer order in mind
		var layerOrder = 0;
	
		// Iterate through every layer
		$(this).find('layer').each(function(){
	
			// The content of the <data> element is base64 encoded
			// This modified function will decode it and return a proper array
			mapData = base64_decode_map($(this).find('data').text());
		
			// Certain layers have properties. Create another temporary array
			// to store them in.
			var properties = {};
			
			layerOrder++;
		
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
				'properties': properties,
				'nr': layerOrder
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
			k.collections.tileproperties[tileSetName] = {};
	
			// Add new tileset to the animatedTiles array
			animatedTiles[tileSetName] = {};	// Deprecated
			k.state.animation.tiles[tileSetName] = {};
	
			// Create a temporary array to store this tileset's properties in
			var tempProperties = {};
	
			// Load through every tile that has a special property
			$(this).find('tile').each(function(){
	
				// Calculate the ID of this tile (they're stored starting with 0, not with their firstgid)
				var tiletid = parseInt($(this).attr('id'));
				var tileGid = parseInt(firstGid) + tiletid;
		
				// Loop through each property and save it in the temporary array
				$(this).find('property').each(function(){
		
					// Save the name and value in a variable, to make our code prettier to read
					var propertyName = $(this).attr('name');
					var propertyValue = $(this).attr('value');
		
					// Look at the name of the given property, and do things accordingly
					switch(propertyName) {
						
						case 'downtile':
						case 'lefttile':
						case 'righttile':
						case 'uptile':
							tempProperties[propertyName] = parseInt(propertyValue) + tileGid;
							break;
						
						case 'nextframe':
							tempProperties[propertyName] = parseInt(propertyValue) + tileGid;
							break;
						
						// Store a reference to this character tile
						// Don't break, we want to use the default action too
						case 'char':
							k.collections.chars[propertyValue] = tileGid;
							oneMap.alias[propertyValue] = tileGid;
						
						case 'alias':
							oneMap.alias[propertyValue] = tileGid;
			
						// If it's none of the above, just save the value as is
						default:
							tempProperties[propertyName] = propertyValue;
					}
		
				});
		
				// Store all the properties of this tile in tileProperties array
				tileProperties[tileSetName][tileGid] = tempProperties;
				k.collections.tileproperties[tileSetName][tileGid] = tempProperties;
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
                        if(tileProperties[tileSetName][tileNumber]['walkable'] !== undefined){
                            walkableTiles[pos] = parseInt(tileProperties[tileSetName][tileNumber]['walkable']); // It's much more logical to set "walkable" to 0
                        }
						
						if(tileProperties[tileSetName][tileNumber]['shadow'] !== undefined){
							
							// Get the coordinates by the lex value
							var coord = k.operations.coord.getByLex(pos, sourcename);
							
							// Increase the x
							coord.mapX++;

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
			"tilesetName": storeAsName,
			"name": storeAsName,
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
		k.state.animation.begins[storeAsName] = {};

        // Increase the loaded counters
        k.state.load.loaded++;
        k.state.load.loadedTilesets++;
        
        // If all the tilesets have loaded, process the walkabletiles
        if(k.state.load.loadedTilesets == k.state.load.toloadTilesets){
            for(map in k.collections.maps)
                k.operations.load.loadWalkableTiles(map);
			
			// And do some other loading stuff
			k.operations.load.finished();
        }

        debugEcho('tileset image"' + source + '" has been downloaded', false);
    });

    // Start downloading the source.
    img.src = k.settings.engine.BASEURL + source

    debugEcho('tileset "' + source + '" has been loaded as "'
              + storeAsName + '"', false);
}

/**
 * Things to do at the very end, after every image has loaded
 */
k.operations.load.finished = function(){
	
	// Set our object
	k.me = k.links.createObject("U00001", 9,24, "template.tmx");
	k.collections.objects["U00001"] = k.me;
	k.sel = k.me;
	
	k.state.load.finished = true;
}