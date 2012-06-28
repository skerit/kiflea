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
 * All keyboard key definitions
 * @typedef {Object}
 */
var key = {
    'Backspace': 8,
    'Tab': 9,
    'Enter': 13,
    'Shift': 16,
    'Ctrl': 17,
    'Alt': 18,
    'Pause': 19,
    'Capslock': 20,
    'Esc': 27,
    'Pageup': 33,
    'Pagedown': 34,
    'End': 35,
    'Home': 36,
    'Leftarrow': 37,
    'Uparrow': 38,
    'Rightarrow': 39,
    'Downarrow': 40,
    'Insert': 45,
    'Delete': 46,
    '0': 48,
    '1': 49,
    '2': 50,
    '3': 51,
    '4': 52,
    '5': 53,
    '6': 54,
    '7': 55,
    '8': 56,
    '9': 57,
    'a': 65,
    'b': 66,
    'c': 67,
    'd': 68,
    'e': 69,
    'f': 70,
    'g': 71,
    'h': 72,
    'i': 73,
    'j': 74,
    'k': 75,
    'l': 76,
    'm': 77,
    'n': 78,
    'o': 79,
    'p': 80,
    'q': 81,
    'r': 82,
    's': 83,
    't': 84,
    'u': 85,
    'v': 86,
    'w': 87,
    'x': 88,
    'y': 89,
    'z': 90,
    '0numpad': 96,
    '1numpad': 97,
    '2numpad': 98,
    '3numpad': 99,
    '4numpad': 100,
    '5numpad': 101,
    '6numpad': 102,
    '7numpad': 103,
    '8numpad': 104,
    '9numpad': 105,
    'Multiply': 106,
    'Plus': 107,
    'Minut': 109,
    'Dot': 110,
    'Slash1': 111,
    'F1': 112,
    'F2': 113,
    'F3': 114,
    'F4': 115,
    'F5': 116,
    'F6': 117,
    'F7': 118,
    'F8': 119,
    'F9': 120,
    'F10': 121,
    'F11': 122,
    'F12': 123,
    'equal': 187,
    'Coma': 188,
    'Slash': 191,
    'Backslash': 220
}

/**
 * This function simulates a keypress we have stored in the queue
 * It checks if an arrow key has been pressed down and repeats it.
 * This function is called every renderFrame();
 */
k.operations.keyboard.fakePress = function() {
    
    // Only do these keypresses every other loop
    if(k.state.keyboard.skippedFrames > 1){
        
		// Reset the skipped frames counter
		k.state.keyboard.skippedFrames = 0;
        
        if(k.state.keyboard.up)
			k.operations.keyboard.doKey({'keyCode': key.Uparrow});
			
        if(k.state.keyboard.down)
			k.operations.keyboard.doKey({'keyCode': key.Downarrow});
			
        if(k.state.keyboard.right)
			k.operations.keyboard.doKey({'keyCode': key.Rightarrow});
			
        if(k.state.keyboard.left)
			k.operations.keyboard.doKey({'keyCode': key.Leftarrow});
    }
    
    k.state.keyboard.skippedFrames++;
}

/**
 * Handle keypresses
 */
k.operations.keyboard.onKeyDown = function(keypress) {

    /**
	 * Queue the arrow keys for later, but execute other keys directly
	 */
    switch (keypress.keyCode) {

        case key.Uparrow: // Arrow up
            k.state.keyboard.up = true;
            break

        case key.Rightarrow: // Arrow right
            k.state.keyboard.right = true;
            break

        case key.Downarrow: // Arrow down
            k.state.keyboard.down = true;
            break
        
        case key.Leftarrow: // Arrow left
            k.state.keyboard.left = true;
            break
        
		// If it's not one of the arrow keys, perform the keypress directly
        default:
            k.operations.keyboard.doKey(keypress);
            break;
    }
    return false;
};

/**
 *Handle the releasing of a key
 */
k.operations.keyboard.onKeyUp = function(keypress) {

    // Select the correct key and release it
    switch (keypress.keyCode) {

        case key.Uparrow: // Arrow up
            k.state.keyboard.up = false;
            break

        case key.Rightarrow: // Arrow right
            k.state.keyboard.right = false;
            break

        case key.Downarrow: // Arrow down
            k.state.keyboard.down = false;
            break
        
        case key.Leftarrow: // Arrow left
            k.state.keyboard.left = false;
            break
    }
    
};

/**
 * Actually perform the keypresses
 * @param   {int}   The key
 */
k.operations.keyboard.doKey = function(keypress) {

    // If the debugCounter is bigger than 1000 this means nothing has happened
    // In a long time. It's best to reset it.
    if(debugCounter > 1000) debugCounterReset();

    // Select the correct key and execute its functions
    switch (keypress.keyCode) {

        case key.Uparrow: // Arrow up
			k.actions.moveRequest(0, -1);
            break

        case key.Rightarrow: // Arrow right
            k.actions.moveRequest(1, 0);
            break

        case key.Downarrow: // Arrow down
            k.actions.moveRequest(0, 1);
            break
        
        case key.Leftarrow: // Arrow left
            k.actions.moveRequest(-1, 0);
            break
        
        case key.Enter:
            //teleport(userPosition.uid, 5, 5);
            //getEventFacing(animatedObjects[userPosition.uid]['map'], animatedObjects[userPosition.uid]['x'], animatedObjects[userPosition.uid]['y'],animatedObjects[userPosition.uid]['direction']);
            break;
        
        case key.z:
            //queueAction('attack', animatedObjects[userPosition.uid]['selection'], 1, userPosition.uid);
            break;
    }
}

/**
 *Get the event of the object you're currently facing
 *@param    mapName     {string}    The name of the map we want the event of
 *@param    x           {integer}   The x tile we want the event of
 *@param    y           {integer}   The y tile we want the vent of
 *@param    direction   {string}    If this is given, we want the event of the object we're facing
 *                                  Else we get the event of the object on x,y
 */
function getEventFacing(mapName, x, y, direction){
    
    switch (direction){
        
        case undefined:
            break;
        
        case 'left':
            x = x-1;
            break;
        
        case 'right':
            x = x+1;
            break;
        
        case 'up':
            y = y-1;
            break;
        
        case 'down':
            y = y+1;
            break;
    }
    
    // This is just testing code. Will be replaced with something much more coherent soon
    for(objects in animatedObjects){
        if(animatedObjects[objects]['x'] == x && animatedObjects[objects]['y'] == y){
            queueText('This is a huge chunk of text that will hopefully get wrapped in some way. Yes, I am an object. Very good of you to see!');
        }
    }
    
}

/**
 *Get the events on a specific tile.
 *If it does, return useful information! (even if there are more than 1 objects)
 *@param    mapName     {string}    The name of the map we want the event of
 *@param    x           {integer}   The x tile we want the event of
 *@param    y           {integer}   The y tile we want the vent of
 *@returns              {array}     An array filled with objects
 */
function getEvents(mapName, x, y){

    var tempArray = [];
    
    // Loop through every object in the animatedObjects object (3 times object, oy!)
    for(objects in animatedObjects){
        if(animatedObjects[objects]['x'] == x && animatedObjects[objects]['y'] == y){
            
            // Put the uid in the temparray (or does it store everything?)
            tempArray.push(objects);
        }
    }
    
    return tempArray;
}

/**
 * Do this on mouseUp
 * @param   {int}   x
 * @param   {int}   y
 */
k.operations.interface.mouseUp = function(x, y){

    var clickedLayer = k.operations.interface.getHudItem(x,y);
    
    // If we've clicked a HUD layer, do something
    if(typeof(clickedLayer) == 'object') {
        
        if(clickedLayer['action'] !== undefined) queueAction(clickedLayer['action']['what'], getSelectedObject(), clickedLayer['action']['value']);
        
    } else { // Alse change our selection
        // Store the tile coordinates in a variable, as it's an object
        var clickCoordinates = getClickedTile(x, y);
        
        var events = getEvents(animatedObjects[userPosition.uid]['map'], clickCoordinates.x, clickCoordinates.y);

        // If we have an event in the array, we'll only take the first one for now.
        if(events.length > 0) {
            animatedObjects[userPosition.uid]['selection'] = events[0];
        } else { // If there isn't an event here, disable our selection
            animatedObjects[userPosition.uid]['selection'] = 0;
        }
    }

}

/**
 * Do this on mouseDown
 * @param   {int}   x
 * @param   {int}   y
 */
k.operations.interface.mouseDown = function(x, y){

    

}

/**
 * Get the clicked tile number, providing absolute x-y coordinates
 * @param    x   {integer}   The X coordinate of the mouseclick
 * @param    y   {integer}   The Y coordinate of the mouseclick
 * @returns      {k.Types.CoordinatesClick}
 */
function dgetClickedTile(mouseX, mouseY){
    
    var tileX = Math.floor(mouseX / k.collections.maps[animatedObjects[userPosition.uid]['map']]['tileWidth']);
    var tileY = Math.floor(mouseY / k.collections.maps[animatedObjects[userPosition.uid]['map']]['tileHeight']);
    
    var x = animatedObjects[userPosition.uid]['position']['x'] + (tileX + (Math.floor(k.links.canvas.visibletilesx(k.collections.maps[animatedObjects[userPosition.uid]['map']]['tileWidth']) / 2)) + 1) - k.links.canvas.visibletilesx(k.collections.maps[animatedObjects[userPosition.uid]['map']]['tileWidth']);
    var y = animatedObjects[userPosition.uid]['position']['y'] + (tileY + (Math.floor(k.links.canvas.visibletilesy(k.collections.maps[animatedObjects[userPosition.uid]['map']]['tileHeight']) / 2))+2) - k.links.canvas.visibletilesy(k.collections.maps[animatedObjects[userPosition.uid]['map']]['tileHeight']);
    
    return {'x': x, 'y': y, 'mouseX': mouseX, 'mouseY': mouseY, 'canvasX': tileX, 'canvasY': tileY};
}

/**
 * Get the coordinates by sector and seclex
 * @param	{k.Types.Sector}	sector
 * @param	{integer}	seclex
 */
k.operations.coord.getBySecLex = function(sector, seclex){
	
	x = sector.coord.mapX + ((seclex % k.settings.engine.SECTORSIZE));
	y = sector.coord.mapY + ~~(seclex / k.settings.engine.SECTORSIZE);
	
	return k.operations.coord.getByMap(x, y);
}

/**
 * Get the tilenumber based on the canvas tile numbers
 * @param    {integer}   x	The x-tile number on the canvas
 * @param    {integer}   y	The y-tile number on the canvas
 * @returns  {k.Types.CoordinatesClick}
 */
k.operations.coord.getByCanvas = function(canvasX, canvasY, mapname){
	
	if(mapname === undefined) {
		var map = k.links.canvas.map;
	} else {
		var map = k.links.getMap(mapname);
	}
	
	var absX = canvasX * map.tileWidth - k.state.engine.mappOffsetX;
	var absY = canvasY * map.tileHeight - k.state.engine.mappOffsetY;
	
	var mapX = k.sel.position.x + canvasX + ~~(k.links.canvas.tpr / 2) + 1
				  - k.links.canvas.tpr;
	
	var mapY = k.sel.position.y + canvasY + ~~(k.links.canvas.tpc / 2) + 2
				  - k.links.canvas.tpc;
				  
	var secInX = mapX % k.settings.engine.SECTORSIZE;
	var secInY = mapY % k.settings.engine.SECTORSIZE;
	var secLex = secInX + secInY * k.settings.engine.SECTORSIZE;
	
	// Coordinates beyond the map can't give a good lex value
	if(mapX < 0 || mapX > map.width ||
	   mapY < 0 || mapY > map.height){
		var lex = -1;
		var sec = -1;
	} else {
		var lex = mapX + mapY * k.links.canvas.map.width;
		
		var secX = Math.ceil(mapX / k.settings.engine.SECTORSIZE);
		var secY = Math.ceil(mapY / k.settings.engine.SECTORSIZE);
		
		var sec = secX + secY * map.spr;
	}
	
	return {'mapX': mapX, 'mapY': mapY,
			'mouseX': absX, 'mouseY': absY,
			'canvasX': canvasX, 'canvasY': canvasY,
			'absX': absX, 'absY': absY,
			'lex': lex, 'sec': sec, 'secLex': secLex,
			'secX' : secInX, 'secY': secInY};

}

/**
 * Get the tilenumber based on the canvas tile numbers
 * @param    {integer}	x   The x-tile number on the canvas
 * @param    {integer}  y	The y-tile number on the canvas
 * @returns	 {k.Types.CoordinatesClick}
 */
k.operations.coord.getByMap = function(mapX, mapY, mapname){

	
	if(mapname === undefined) {
		var map = k.links.canvas.map;
	} else {
		var map = k.links.getMap(mapname);
	}
	
	var lex = mapX + mapY * map.width;
	
	var canvasX = (mapX - k.sel.position.x) + ~~(k.links.canvas.tpr / 2);
	var canvasY = (mapY - k.sel.position.y) + ~~(k.links.canvas.tpc / 2) -1;
	
	var absX = canvasX * map.tileWidth - k.state.engine.mappOffsetX;
	var absY = canvasY * map.tileHeight - k.state.engine.mappOffsetY;
	
	var secX = ~~(mapX / k.settings.engine.SECTORSIZE);
	var secY = ~~(mapY / k.settings.engine.SECTORSIZE);
	
	var sec = secX + secY * map.spr;
	
	var secInX = mapX % k.settings.engine.SECTORSIZE;
	var secInY = mapY % k.settings.engine.SECTORSIZE;
	var secLex = secInX + secInY * k.settings.engine.SECTORSIZE;
	   
    return {'mapX': mapX, 'mapY': mapY,
			'mouseX': absX, 'mouseY': absY,
			'canvasX': canvasX, 'canvasY': canvasY,
			'absX': absX, 'absY': absY,
			'lex': lex, 'sec': sec, 'secLex': secLex,
			'secX' : secInX, 'secY': secInY};
}

/**
 * Get the coordinates based on the clicked mouse coordinates
 * @param    {integer}   mouseX	The X coordinate of the mouseclick
 * @param    {integer}   mouseY	The Y coordinate of the mouseclick
 * @param	 {string}	 mapname
 * @returns      {k.Types.CoordinatesClick}
 */
k.operations.coord.getByMouse = function(mouseX, mouseY, mapname){
	
	if(mapname === undefined) {
		var map = k.links.canvas.map;
	} else {
		var map = k.links.getMap(mapname);
	}
	
    var canvasX = ~~(mouseX / map.tileWidth);
    var canvasY = ~~(mouseY / map.tileHeight);
    
	var mapX = k.sel.position.x + canvasX + ~~(k.links.canvas.tpr / 2) + 1
				  - k.links.canvas.tpr;
	
	var mapY = k.sel.position.y + canvasY + ~~(k.links.canvas.tpc / 2) + 2
				  - k.links.canvas.tpc;
				  
	var absX = canvasX * map.tileWidth - k.state.engine.mappOffsetX;
	var absY = canvasY * map.tileHeight - k.state.engine.mappOffsetY;
	
	var lex = mapX + mapY * map.width;
	
	var secX = ~~(mapX / k.settings.engine.SECTORSIZE);
	var secY = ~~(mapY / k.settings.engine.SECTORSIZE);
	
	var sec = secX + secY * map.spr;
	
	var secInX = mapX % k.settings.engine.SECTORSIZE;
	var secInY = mapY % k.settings.engine.SECTORSIZE;
	var secLex = secInX + secInY * k.settings.engine.SECTORSIZE;
	
    return {'mapX': mapX, 'mapY': mapY,
		    'mouseX': mouseX, 'mouseY': mouseY,
			'canvasX': canvasX, 'canvasY': canvasY,
			'absX': absX, 'absY': absY,
			'lex': lex, 'sec': sec, 'secLex': secLex,
			'secX' : secInX, 'secY': secInY};
}

/**
 * Get the coordinates based on the lexicographic order on the map
 * @param    {integer}	lex		The lexicographic order
 * @param	{string}	mapname
 * @returns      {k.Types.CoordinatesClick}
 */
k.operations.coord.getByLex = function(lex, mapname){
	
	if(mapname === undefined) {
		var map = k.links.canvas.map;
	} else {
		var map = k.links.getMap(mapname);
	}

	var mapX = lex % map.width;
	var mapY = Math.floor(lex / map.width);

	var canvasX = (mapX - k.sel.position.x) + ~~(k.links.canvas.tpr / 2);
	var canvasY = (mapY - k.sel.position.y) + ~~(k.links.canvas.tpc / 2) -1;

	var absX = canvasX * map.tileWidth - k.state.engine.mappOffsetX;
	var absY = canvasY * map.tileHeight - k.state.engine.mappOffsetY;
	
	var secX = ~~(mapX / k.settings.engine.SECTORSIZE);
	var secY = ~~(mapY / k.settings.engine.SECTORSIZE);
	
	var sec = secX + secY * map.spr;
	
	var secInX = mapX % k.settings.engine.SECTORSIZE;
	var secInY = mapY % k.settings.engine.SECTORSIZE;
	var secLex = secInX + secInY * k.settings.engine.SECTORSIZE;

	return {'mapX': mapX, 'mapY': mapY,
			'mouseX': absX, 'mouseY': absY,
			'canvasX': canvasX, 'canvasY': canvasY,
			'absX': absX, 'absY': absY,
			'lex': lex, 'sec': sec, 'secLex': secLex,
			'secX' : secInX, 'secY': secInY};

}

/**
 *Very basic function that adds text to an array to be shown later
 *@param    text    {string}    The text to output on screen
 *@param    style   {string}    The style to use, as defined in the hud.json file
 */
function queueText(text, style){
    
    // We need to break down, wrap the text. These variables will help
    var tempText = [];
    var tempLength = text.length;
    
    // If no style is given, style should be default
    if(style === undefined) style = "default";
    
    // Now copy the style over
    if(hudLayers['font'][style] === undefined) { // If the given style does not exist, copy the fallback one
        style = deepCopy(font);
    } else {
        style = deepCopy(hudLayers['font'][style]);     // Copy over the style if it does exist
    }
    
    // How high and wide is the background of the text going to be?
    var width = canvasWidth - style['dx'] - 16;        // The width of the canvas - the x offset - 4 (for spacing)
    var height = ((style['height']*2) * style['size']) + (style['vBorder']*2);

    // How many chars per line can we show?
    var realCharwidth = style['width'] * style['size'];        // The real size of a single character
    var charsPerLine = Math.floor(((width - (style['hBorder']*2))/realCharwidth));
    
    // Where are we going to show it?
    var oriCor = orientationCoordinates(style['orientation'], style['dx'], style['dy'], width, height);
    style['dx'] = oriCor['x'];
    style['dy'] = oriCor['y'];
    style['dwidth'] = oriCor['width'];
    style['dheight'] = oriCor['height'];

    
    // If there are more characters than we can show per line...
    for(var cursor = 0; text.length > (cursor * charsPerLine); cursor++){
    
        // The templength is the ammount of chars we have left.
        tempLength -= charsPerLine;
    
        // If the templength is below zero, it means there are less than charsPerLine
        // Characters to show, so we need to change the splicelength
        if(tempLength >= 0){
            var spliceLength = charsPerLine;    // If it's ok, the splicelength is default
        } else {
            spliceLength = (tempLength+charsPerLine);   // If not, calculate the splicelength
        }
        
        // Store every line in this array
        tempText.push(trim(text.slice((cursor)*charsPerLine, (spliceLength + (charsPerLine*cursor)))));
    }
    
    // Clear the textobjects array
    textObjects = [];
    
    textObjects.push({
        'text': tempText,               // An array with every line
        'dismissed': 0,
        'fpsshown': 0,
        'pieces': tempText.length,      // The ammount of lines
        'cursor': 0,                     // Where we're currently
        'style': style,
        'charsPerLine': charsPerLine
    });
    
}
