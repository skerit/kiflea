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

// A var storing all useful keys for easy access
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
 *This function simulates a keypress.
 *It checks if an arrow key has been pressed down and repeats it.
 *This function is called in the renderloop()
 */
function fakePress() {
    
    // Only do these keypresses every other loop
    if(keyFake.ms > 1){
        keyFake.ms = 0; // Reset the ms timer
        
        if(keyFake.up == true) keyFinish({'keyCode': key.Uparrow});
        if(keyFake.down == true) keyFinish({'keyCode': key.Downarrow});
        if(keyFake.right == true) keyFinish({'keyCode': key.Rightarrow});
        if(keyFake.left == true) keyFinish({'keyCode': key.Leftarrow});
    }
    
    keyFake.ms++;
}

/**
 *Handle keypresses
 */
function onKeyDown(keypress) {

    // Select the correct key and execute its functions
    switch (keypress.keyCode) {

        case key.Uparrow: // Arrow up
            keyFake.up = true;
            break

        case key.Rightarrow: // Arrow right
            keyFake.right = true;
            break

        case key.Downarrow: // Arrow down
            keyFake.down = true;
            break
        
        case key.Leftarrow: // Arrow left
            keyFake.left = true;
            break
        
        default:
            keyFinish(keypress);
            break;
    }
};

/**
 *Handle the releasing of a key
 */
function onKeyUp(keypress) {

    // Select the correct key and release it
    switch (keypress.keyCode) {

        case key.Uparrow: // Arrow up
            keyFake.up = false;
            break

        case key.Rightarrow: // Arrow right
            keyFake.right = false;
            break

        case key.Downarrow: // Arrow down
            keyFake.down = false;
            break
        
        case key.Leftarrow: // Arrow left
            keyFake.left = false;
            break
    }
    
};

/**
 *This function is called after we sorted the keydown
 *@param    key     {int}   The key
 */
function keyFinish(keypress) {

    // If the debugCounter is bigger than 1000 this means nothing has happened
    // In a long time. It's best to reset it.
    if(debugCounter > 1000) debugCounterReset();

    // Select the correct key and execute its functions
    switch (keypress.keyCode) {

        case key.Uparrow: // Arrow up
            addPath(0,-1);
            break

        case key.Rightarrow: // Arrow right
            addPath(1,0);
            break

        case key.Downarrow: // Arrow down
            addPath(0,1);
            break
        
        case key.Leftarrow: // Arrow left
            addPath(-1,0);
            break
        
        case key.Enter:
            transport(userPosition.uid, 5, 5);
            getEventFacing(userPosition.map, animatedObjects[userPosition.uid]['x'], animatedObjects[userPosition.uid]['y'],animatedObjects[userPosition.uid]['direction']);
            break;
    }
    
    // Send the data to the server
    if(connectToServer == true) ws.send(JSON.stringify(animatedObjects[userPosition.uid]));
    
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
            showText('This is a huge chunk of text that will hopefully get wrapped in some way. Yes, I am an object. Very good of you to see!');
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
 *Do this on mouseclick
 */
function onMouseclick(x, y){
    
    var clickedLayer = getHudClicked(x,y);
    
    // If we've clicked a HUD layer, do something
    if(typeof(clickedLayer) == 'object') {
        
        if(clickedLayer['action'] !== undefined) executeAction(clickedLayer['action']['what'], getSelectedObject(), clickedLayer['action']['value']);
        
    } else { // Alse change our selection
        // Store the tile coordinates in a variable, as it's an object
        var clickCoordinates = getClickedTile(x, y);
        
        var events = getEvents(userPosition.map, clickCoordinates.x, clickCoordinates.y);
        
        // If we have an event in the array, we'll only take the first one for now.
        if(events.length > 0) {
            animatedObjects[userPosition.uid]['selection'] = events[0];
        } else { // If there isn't an event here, disable our selection
            animatedObjects[userPosition.uid]['selection'] = 0;
        }
    }
    // Send the data to the server
    if(connectToServer == true) ws.send(JSON.stringify(animatedObjects[userPosition.uid]));
}

/**
 *Get the clicked tile number, providing absolute x-y coordinates
 *@param    x   {integer}   The X coordinate of the mouseclick
 *@param    y   {integer}   The Y coordinate of the mouseclick
 *@returns      {object}    The X and Y tile
 */
function getClickedTile(x, y){
    
    tileX = Math.floor(x / maps[userPosition.map]['tileWidth']);
    tileY = Math.floor(y / maps[userPosition.map]['tileHeight']);
    
    x = animatedObjects[userPosition.uid]['x'] + (tileX + (Math.floor(visibleTilesX / 2)) + 1) - visibleTilesX;
    y = animatedObjects[userPosition.uid]['y'] + (tileY + (Math.floor(visibleTilesY / 2))+2) - visibleTilesY;
    
    //testPath = findPath(animatedObjects['U00002']['x'], animatedObjects['U00002']['y'], x, y);
    //animatedObjects['U00002']['path'] = deepCopy(testPath);

    return {'x': x, 'y': y};
}

/**
 *Very basic function that adds text to an array to be shown later
 */
function showText(text){
    
    // The text needs to be broken down.
    var tempText = [];
    var tempLength = text.length;
    
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
    
    textObjects.push({
        'text': tempText,               // An array with every line
        'dismissed': 0,
        'fpsshown': 0,
        'pieces': tempText.length,      // The ammount of lines
        'cursor': 0                     // Where we're currently
    });
    
}
