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
 *  Load the HUD
 */
function getHud(){
    
    // Increase the toLoad variable
    toLoad++;
    
    debugHud('Loading hud ...', false);
    
    // Use a jquery function to fetch the json
    $.getJSON(loadHud, function(data) {
	hudLayers = data;	// Store the data
        
        debugHud('Hud has been loaded succesfully', false);
        loaded++;
    });
}

/**
 *Execute actions
 *@param	actionName	{string}	The name of the action to do
 *@param	target		{string}	The target of the action
 *@param	value		{string}	The value of the action
 */
function executeAction(actionName, target, value){

    switch(actionName){
	
	// Testing action that will up your HP
	case 'hpup':
	    if(animatedObjects[target]['currenthealth'] < animatedObjects[target]['fullhealth']){
		animatedObjects[target]['currenthealth']++;
	    }
	    break;

	case 'fireball':
	    if(animatedObjects[target]['currenthealth'] > 0){
		animatedObjects[target]['currenthealth'] -= value;
		animatedObjects[target]['effects'].push({'sprite': 43, 'currentsprite': 43, 'sx': animatedObjects[userPosition.uid]['x'], 'sy': animatedObjects[userPosition.uid]['y'], 'dx': animatedObjects[target]['x'], 'dy': animatedObjects[target]['y'], 'x': animatedObjects[userPosition.uid]['x'], 'y': animatedObjects[userPosition.uid]['y'], 'msPerTile': 90, 'msMoved': 100, 'started': now(), 'aftereffect': 107, 'id': rand(100)});
	    }
	    break;
    }
    
}

/**
 *Draw the HUD
 */
function drawHud(){
    
    // Clear the previousHudLayers variable
    previousHudLayers = {};
    previousHudLayers['layers'] = [];
   
   // Loop through the layers
   for(var layer = 0; layer < hudLayers['layers'].length; layer++){

	// Store the to-be-calculated values in this object
	var tempValues = deepCopy(hudLayers['layers'][layer]);
	
	// Loop through the object and alculate the hudvariable for each
	for(name in tempValues){
	    // Only get the Hudvariable if it contains an object AND isn't an action, else just use the value in it.
	    tempValues[name] = (typeof(tempValues[name]) == 'object' && name != "action") ? getHudVariable(tempValues[name]['dependon'], tempValues[name]['field'], tempValues[name]['value'], tempValues[name]) : tempValues[name];
	}
	
	// Go to the next layer if the "show" field is 0
	if(tempValues['show'] == 0) continue;
        
        // The only thing left to do is to adjust the destination according to our orientation
        switch(tempValues['orientation']){

            case 'topright':
                tempValues['dx'] = canvasWidth - tempValues['dx'] - tempValues['width']; // Y doesn't need to be set
                break;

            case 'topleft': // nothing needs to be changed for topleft, as it's canvas default
                break;

            case 'bottomright':
                tempValues['dx'] = canvasWidth - tempValues['dx']- tempValues['width'];
                tempValues['dy'] = canvasHeight - tempValues['dy'] - tempValues['height'];
                break;

            case 'bottomleft': // X doesn't need to change
                tempValues['dy'] = canvasHeight - tempValues['dy'] - tempValues['height'];
                break;
        }
	
	switch(tempValues['tileset']){
	    
	    case "ctx-circle":
		ctx.beginPath();
		ctx.fillStyle = tempValues['fillstyle'];
		ctx.strokeStyle = tempValues['strokestyle'];
		ctx.arc(tempValues['dx'],tempValues['dy'],tempValues['width'],0,Math.PI*2,true);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		break;
	    
	    default:
		debugHud('Drawhud ' + tempValues['name'] + ' (' + tempValues['sx'] + ',' + tempValues['sy'] + ',' + tempValues['width'] + ',' + tempValues['height'] + ') to (' + tempValues['dx'] + ',' + tempValues['dy'] + ',' + tempValues['width'] + ',' + tempValues['height'] + ')');
	   
		// Draw the actual image
		ctx.drawImage(
			 tileSet[tempValues['tileset']]['image'],
			 tempValues['sx'],
			 tempValues['sy'],
			 tempValues['width'],
			 tempValues['height'],
			 tempValues['dx'],
			 tempValues['dy'],
			 tempValues['width'],
			 tempValues['height']
		);
		break;
	}
	
	// Put this layer in the previousHudLayers array.
	// After this function, every layer that has been drawn will be there.
	previousHudLayers['layers'].push(tempValues);
    
   } // Loop to the next layer
   
   //drawDialog("bordersmall", 50, 100, 200,150);
   //drawDialog("bordersmall", 200, 350, 68,150);

}

/**
 *Detect if there's a hud item where we've clicked
 *@param	x	{integer}
 *@param	y	{integer}
 *@returns	{object}		The layer we've clicked
 */
function getHudClicked(x, y){
    
    debugHud('Clicked ' + x + ',' + y);
    
    var returnObject = 0;	// Define it as an integer for now, otherwise the typeof won't work later on.

   // Loop through the layers, even if we've alreayd found a match (because
   // you can only click on the top layer, which comes last)
   for(var layer = 0; layer < previousHudLayers['layers'].length; layer++){
    
	// Calculate 'til what X and Y location this element goes
	var endX = previousHudLayers['layers'][layer]['dx'] + previousHudLayers['layers'][layer]['width'];
	var endY = previousHudLayers['layers'][layer]['dy'] + previousHudLayers['layers'][layer]['height'];
	
	// Now see if our clicked X and Y coordinates fall in between these ranges
	if((x >= previousHudLayers['layers'][layer]['dx'] && x <= endX) && (y >= previousHudLayers['layers'][layer]['dy'] && y <= endY)){
	    
	    // Save it for sending later with deepCopy (as to not send it by reference)
	    returnObject = deepCopy(previousHudLayers['layers'][layer]);
	    
	    debugHud('You\'ve clicked <b>' + previousHudLayers['layers'][layer]['name'] + '</b>');
	}
   }
   
   if(typeof(returnObject) == 'object') return returnObject;
}

/**
 *Return a HUD variable
 *@param    dependon    {string}    On what our calculation should depend (currently "own" or "selection")
 *@param    field       {string}    What field we should get from our depending object.
 *                                  Certain special 'functions' can also be called.
 *@param    value       {int}       The value we need to modify, if there is one
 *@param    field	{string}    For which field we're going to use it. (sx, dx, width, ...)
 *@returns  {whatever}              Returns whatever it needs.
 */
function getHudVariable(dependon, field, value, purpose){
    
    //debugHud('Getting hud variable field <b>' + field + '</b> from <b>' + dependon + '</b> value <b>' + value + '</b>');
    
    var targetObject;   // We'll store our target in here, once we know what it is
    var result;         // The result goes here
    
    // We'll decide which object we want to get the info out of first
    switch(dependon){
        case 'selection':
            targetObject = animatedObjects[userPosition.uid]['selection'];
	    if(targetObject===undefined || targetObject == 0) return 0; // If we haven't selected anything, return 0.
            break;
        case 'own':
            targetObject = userPosition.uid;
            break;
    }
    
    // Now check if we have a special function for the given value
    
    switch(field){
        
        case 'health':  // Calculate how much health we have left
            debugHud('Object <b>' + targetObject + '</b>\'s current health: <b>' + animatedObjects[targetObject]['currenthealth'] + '</b>');
            result = (animatedObjects[targetObject]['currenthealth'] / animatedObjects[targetObject]['fullhealth']) * value;
            if(result<0) result = 0;
    }
    
    return result;
    
}

/**
 *Get the event of a tile on a map
 */
function getMapEvent(mapname, x, y){
      
    var currentTile = (y * maps[mapname]['width']) + x;
    
    if(maps[mapname]['events'][currentTile] !== undefined){
	debugEcho('Event!');
	
	// Loop through every event
	for(var eventNr = 0; eventNr < maps[mapname]['events'][currentTile].length; eventNr++){
	    
	    // And add it to the actionsreceived of this user
	    animatedObjects[userPosition.uid]['actionsreceived'].push(maps[mapname]['events'][currentTile][eventNr]);
	}
	
    }
    
}

/**
 *Drawing a dialog window
 */
function drawDialog(dialogset, x, y, width, height){

    // Get the wanted dialog information
    var tempValues = hudLayers['dialog'][dialogset];
    
    // Get necesary info
    var vMidHeight = tempValues['left']['height'];	// Get the height of the vertical middle pieces (they repeat)
    var hMidWidth = tempValues['topmiddle']['width'];	// Get the width of the horizontal middle pieces (they also repeat)
    var cornerWidth = tempValues['topleft']['width'];
    var cornerHeight = tempValues['topleft']['height'];
    
    // Calculate what we actually need to draw
    var hMidPieces = Math.floor((width - (2*cornerWidth))/hMidWidth);		// How many vertical middle pieces will we have to draw?
    var vMidPieces = Math.floor((height - (2*cornerHeight))/vMidHeight);	// How many vertical middle pieces will we have to draw?
    
    previousHudLayers['layers'].push({"name": "dialog", "width" : width, "height": height, "dx": x, "dy": y});
    
    // Draw the top (the "title bar" as you wish)
    // Start with the left corner
    ctx.drawImage(
	     tileSet[tempValues['tileset']]['image'],
	     tempValues['topleft']['sx'],
	     tempValues['topleft']['sy'],
	     cornerWidth,
	     cornerHeight,
	     x,
	     y,
	     cornerWidth,
	     cornerHeight
    );
    
    // Now loop through every middle piece
    for(var piece = 1; piece < hMidPieces; piece++){
	ctx.drawImage(
		 tileSet[tempValues['tileset']]['image'],
		 tempValues['topmiddle']['sx'],
		 tempValues['topmiddle']['sy'],
		 hMidWidth,
		 tempValues['topmiddle']['height'],
		 x + (piece * hMidWidth),
		 y,
		 hMidWidth,
		 tempValues['topmiddle']['height']
	);
    }
    
    // Now draw the right corner
    ctx.drawImage(
	     tileSet[tempValues['tileset']]['image'],
	     tempValues['topright']['sx'],
	     tempValues['topright']['sy'],
	     cornerWidth,
	     cornerHeight,
	     x  + (hMidPieces * hMidWidth),
	     y,
	     cornerWidth,
	     cornerHeight
    );

    // Draw the vertical pieces
    // Starting with the left ones
    for(var piece = 1; piece < vMidPieces; piece++){
	ctx.drawImage(
		 tileSet[tempValues['tileset']]['image'],
		 tempValues['left']['sx'],
		 tempValues['left']['sy'],
		 tempValues['left']['width'],
		 vMidHeight,
		 x,
		 y + (piece * vMidHeight),
		 tempValues['left']['width'],
		 vMidHeight
	);
    };

    // Now the right ones
    for(var piece = 1; piece < vMidPieces; piece++){
	ctx.drawImage(
		 tileSet[tempValues['tileset']]['image'],
		 tempValues['right']['sx'],
		 tempValues['right']['sy'],
		 tempValues['right']['width'],
		 vMidHeight,
		 x + (hMidPieces * hMidWidth),
		 y + (piece * vMidHeight),
		 tempValues['right']['width'],
		 vMidHeight
	);
    };

    // Draw the bottom
    // Start with the left corner
    ctx.drawImage(
	     tileSet[tempValues['tileset']]['image'],
	     tempValues['bottomleft']['sx'],
	     tempValues['bottomleft']['sy'],
	     cornerWidth,
	     cornerHeight,
	     x,
	     y + (vMidPieces * vMidHeight),
	     cornerWidth,
	     cornerHeight
    );
    
    // Now loop through every middle piece
    for(var piece = 1; piece < hMidPieces; piece++){
	ctx.drawImage(
		 tileSet[tempValues['tileset']]['image'],
		 tempValues['bottommiddle']['sx'],
		 tempValues['bottommiddle']['sy'],
		 hMidWidth,
		 tempValues['bottommiddle']['height'],
		 x + (piece * hMidWidth),
		 y + (vMidPieces * vMidHeight),
		 hMidWidth,
		 tempValues['bottommiddle']['height']
	);
    }
    
    // Now draw the right corner
    ctx.drawImage(
	     tileSet[tempValues['tileset']]['image'],
	     tempValues['bottomright']['sx'],
	     tempValues['bottomright']['sy'],
	     cornerWidth,
	     cornerHeight,
	     x  + (hMidPieces * hMidWidth),
	     y + (vMidPieces * vMidHeight),
	     cornerWidth,
	     cornerHeight
    );

}

/**
 *Draw the cursor at the position of the mouse
 */
function drawCursor(){
    //drawTileSpecific("fireball", 1, mouseX, mouseY);

    ctx.drawImage(
	     tileSet['pointer']['image'],
	     0,
	     0,
	     19,
	     19,
	     mouseX,
	     mouseY,
	     19,
	     19
    );

}
