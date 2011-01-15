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
k.operations.load.getHud = function(){
    
    debugHud('Loading hud ...', false);
    
    // Use a jquery function to fetch the json
    $.getJSON(loadHud, function(data) {
		k.collections.hudLayers = data;	// Store the data
		k.state.load.loadedHud = true;
        debugHud('Hud has been loaded succesfully', false);
    });
}

/**
 *Queue actions
 *@param	actionName	{string}	The name of the action to do
 *@param	objectId	{string}	The target of the action
 *@param	value		{string}	The value of the action
 *@param	from		{string}	The source object
 */
function queueAction(actionName, objectId, value, from){

    // If we're given an object as actionName, push that out instead and return
    if(typeof actionName == "object"){
	animatedObjects[objectId]['actionsreceived'].push(actionName);
	return true;
    };

    switch(actionName){
	
	// Testing action that will up your HP
	case 'hpup':
	    if(animatedObjects[objectId]['currenthealth'] < animatedObjects[target]['fullhealth']){
		animatedObjects[objectId]['currenthealth']++;
	    }
	    break;

	case 'fireball':
	    if(animatedObjects[objectId]['currenthealth'] > 0){
		animatedObjects[objectId]['currenthealth'] -= value;
		animatedObjects[objectId]['effects'].push({'sprite': 43, 'currentsprite': 43, 'sx': animatedObjects[userPosition.uid]['x'], 'sy': animatedObjects[userPosition.uid]['y'], 'dx': animatedObjects[objectId]['x'], 'dy': animatedObjects[objectId]['y'], 'x': animatedObjects[userPosition.uid]['x'], 'y': animatedObjects[userPosition.uid]['y'], 'msPerTile': 90, 'msMoved': 100, 'started': now(), 'aftereffect': 107, 'id': rand(100)});
	    }
	    break;

	case 'attack':
	    // Attack objectId coming from from
	    animatedObjects[objectId]['actionsreceived'].push({
		"name": "attack",
		"action": "attack",
		"type": "attack",
		"from": from,
		"value": value
		});
	    break;
	
    case 'attackmode':
	debugEcho('set attackmode for ' + objectId + ' from ' + from);
	    animatedObjects[objectId]['actionsreceived'].push({
		"name": "attackmode",
		"action": "attackmode",
		"type": "attackmode",
		"target": objectId,
		"from": from,
		"value": value
		});
	    break;
    }
    
}

/**
 *Calculate coördinates with the given orientation
 */
function orientationCoordinates(orientation, x, y, width, height){
    
    switch(orientation){

	case 'topright':
	    x = k.links.canvas.width - x - width; // Y doesn't need to be set
	    break;

	case 'topleft': // nothing needs to be changed for topleft, as it's canvas default
	    break;

	case 'bottomright':
	    x = k.links.canvas.width - x - width;
	    y = k.links.canvas.height - y - height;
	    break;

	case 'bottomleft': // X doesn't need to change
	    y = k.links.canvas.height - y - height;
	    break;
    }
    
    // Return the new data
    return {"orientation": orientation, "x": x, "y": y, "width": width, "height": height};
    
}

/**
 *Draw the HUD if it has been loaded
 */
function drawHud(){


	if(!k.state.load.loadedHud) return false;

	// Clear the previousHudLayers variable
	k.state.hud.layers = [];

	// Loop through the layers
	for(var layer = 0; layer < k.collections.hudLayers.layers.length; layer++){

		// Store the to-be-calculated values in this object
		var tempValues = deepCopy(k.collections.hudLayers.layers[layer]);

		// Loop through the object and alculate the hudvariable for each
		for(name in tempValues){
			// Only get the Hudvariable if it contains an object AND isn't an action, else just use the value in it.
			tempValues[name] = (typeof(tempValues[name]) == 'object' && name != "action") ? dependCondition(tempValues[name]['dependon'], tempValues[name]['field'], tempValues[name]['value'], tempValues[name]) : tempValues[name];
		}

		tempValues["type"] = "hudelement";
	
		// Go to the next layer if the "show" field is 0
		if(tempValues['show'] == 0) continue;

		// The only thing left to do is to adjust the destination according to our orientation
		var oriCor = orientationCoordinates(tempValues['orientation'], tempValues['dx'], tempValues['dy'], tempValues['width'], tempValues['height']);
		tempValues['dx'] = oriCor['x'];
		tempValues['dy'] = oriCor['y'];
	
		switch(tempValues['tileset']){

			case "ctx-circle":
				k.links.canvas.buffer.beginPath();
				k.links.canvas.buffer.fillStyle = tempValues['fillstyle'];
				k.links.canvas.buffer.strokeStyle = tempValues['strokestyle'];
				k.links.canvas.buffer.arc(tempValues['dx'],tempValues['dy'],tempValues['width'],0,Math.PI*2,true);
				k.links.canvas.buffer.fill();
				k.links.canvas.buffer.stroke();
				k.links.canvas.buffer.closePath();
				break;

			default:
				debugHud('Drawhud ' + tempValues['name'] + ' (' + tempValues['sx'] + ',' + tempValues['sy'] + ',' + tempValues['width'] + ',' + tempValues['height'] + ') to (' + tempValues['dx'] + ',' + tempValues['dy'] + ',' + tempValues['width'] + ',' + tempValues['height'] + ')');

				// Draw the actual image
				k.links.canvas.buffer.drawImage(
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
		k.state.hud.layers.push(tempValues);

	} // Loop to the next layer

	// Now draw dialog windows
	for(var layer = 0; layer < k.state.hud.openedDialogs.length; layer++){
		var md = k.state.hud.openedDialogs[layer];
		drawDialog(md.dialogset,  md.x,  md.y,  md.width,  md.height, layer);
	}

}

/**
 *Detect if there's a hud item where we've clicked
 *@param	x	{integer}
 *@param	y	{integer}
 *@returns	{object}		The layer we've clicked
 */
k.operations.interface.getClicked = function(x, y){

    var returnObject = 0;	// Define it as an integer for now, otherwise the typeof won't work later on.

   // Loop through the layers, even if we've already found a match (because
   // you can only click on the top layer, which comes last)
   for(var layer = 0; layer < k.state.hud.layers.length; layer++){
    
	// Calculate 'til what X and Y location this element goes
	var endX = k.state.hud.layers[layer]['dx'] + k.state.hud.layers[layer]['width'];
	var endY = k.state.hud.layers[layer]['dy'] + k.state.hud.layers[layer]['height'];
	
	// Now see if our clicked X and Y coordinates fall in between these ranges
	if((x >= k.state.hud.layers[layer]['dx'] && x <= endX) && (y >= k.state.hud.layers[layer]['dy'] && y <= endY)){
	    
	    // Save it for sending later with deepCopy (as to not send it by reference)
	    returnObject = deepCopy(k.state.hud.layers[layer]);

		// Calculate where we clicked the object
		returnObject['clickedX'] = x - k.state.hud.layers[layer]['dx'];
		returnObject['clickedY'] = y - k.state.hud.layers[layer]['dy'];
	    
	    debugHud('Clicked a <b>' + k.state.hud.layers[layer].type + '</b> called "' + k.state.hud.layers[layer]['name'] + '"');
	}
   }
   
   if(typeof(returnObject) == 'object'){
	   return returnObject;
   } else {
	   return false;
   }
}

/**
 *Resolve a condition
 *@param    dependon    {string}    On what our calculation should depend (currently "own" or "selection")
 *@param    field       {string}    What field we should get from our depending object.
 *                                  Certain special 'functions' can also be called.
 *@param    value       {int}       The value we need to modify, if there is one
 *@param    purpose	{string}    For which field we're going to use it. (sx, dx, width, ...)
 *@param    parameter	{string}    Another parameter for the field
 *@param    condition	{string}    A condition the parameter needs to fulfill
 *@param    conditionOperator
 *@returns  {whatever}              Returns whatever it needs.
 */
function dependCondition(dependon, field, value, purpose, parameter, condition, conditionOperator){
    
    var targetObject;   // We'll store our target in here, once we know what it is
    var result = false;         // The result goes here. Standard is false.
    
    if(conditionOperator === undefined) conditionOperator = "=="; // If there is no conditionOperator, the default is "equal to"
    
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
	    break;
	
	case 'event':
	    
	    // Make sure the parameter exists! If it doesn't, it's 0
	    if(animatedObjects[targetObject]['finishedEvents'][parameter] === undefined){
		checkedParameter = 0;
	    } else {
		checkedParameter = animatedObjects[targetObject]['finishedEvents'][parameter];
	    }
	    
	    if(getCondition(checkedParameter, conditionOperator, condition) == true) result = true;
	    break;
    }
    
    return result;
    
}

/**
 *Get the condition
 */
function getCondition(parameter, operator, condition){
    
    // Switch between the operators (==, <, >)
    switch(operator){
	
	case "==":
	    if(parameter == condition) return true;
	    break;
	
	case ">":
	    if(parameter > condition) return true;
	    break;
	
	case "<":
	    if(parameter < condition) return true;
	    break;
	
    }
    
    // If nothing passed, return false:
    return false;
    
}

/**
 *Get the event of a tile on a map
 */
function getMapEvent(objectId, x, y){
      
    var mapname = animatedObjects[objectId]['map'];
    
    var currentTile = (y * maps[mapname]['width']) + x;
    
    if(maps[mapname]['events'][currentTile] !== undefined){
	
	// Loop through every event
	for(var eventNr = 0; eventNr < maps[mapname]['events'][currentTile].length; eventNr++){
	    
	    // And add it to the actionsreceived of this user
	    queueAction(maps[mapname]['events'][currentTile][eventNr], objectId);

	}
	
    }
    
}

/**
 * Add a new dialog window to the list
 */
k.operations.interface.openDialog = function(dialogset, x, y, width, height){

	var index = k.state.hud.openedDialogs.push({'dialogset': dialogset, 'x': x, 'y': y, 'width': width, 'height': height});

	k.state.hud.openedDialogs[index-1]['index'] = index-1;
}

/**
 * Move a window
 * @param dialogObject {object}     A non-referenced copy of the dialogObject
 */
k.operations.interface.moveDialog = function(dialogObject, x, y){

	if(typeof(dialogObject) == 'object') {
		if(dialogObject.type == "dialog") {
			k.state.hud.openedDialogs[dialogObject.index].x = x - dialogObject.clickedX;
			k.state.hud.openedDialogs[dialogObject.index].y = y - dialogObject.clickedY;
		}
	}

}

/**
 *Drawing a dialog window
 */
function drawDialog(dialogset, x, y, width, height, index){

	if(!k.state.load.loadedHud) return false;

    // Get the wanted dialog information
    var dialog = k.collections.hudLayers['dialog'][dialogset];

	// Keep track of how much space everything takes
	var stack = {};

	// Blur dialog background
	if(x < 0){
		blurWidth = width + x;
		blurX = 0;
	} else {

		if((x+width) > k.links.canvas.width) {
			blurWidth = width - ((x+width)-k.links.canvas.width);
			blurX = x;
		} else {
			blurWidth = width;
			blurX = x;
		}
	}

	if(y < 0) {
		blurHeight = height + y;
		blurY = 0;
	} else {
		if((y+height) > k.links.canvas.height){
			blurHeight = height - ((y+height) - k.links.canvas.height);
			blurY = y;
		} else {
			blurHeight = height;
			blurY = y;
		}
	}

	// Test blur background
	var tEl = document.createElement('canvas');
	tEl.width = width;
	tEl.height = height;

	tBuf = tEl.getContext('2d');

	tBuf.drawImage(k.links.canvas.bufferElement, blurX, blurY, blurWidth, blurHeight, 0, 0, blurWidth, blurHeight);
	//tBuf.putImageData(k.links.canvas.buffer.getImageData(x, y, width, height));

	blur(tBuf, tEl, 4);

	k.links.canvas.buffer.drawImage(tEl, blurX, blurY);

	// Draw the background rectangle
	k.links.canvas.buffer.fillStyle = dialog.fillstyle;
	k.links.canvas.buffer.fillRect(x+1, y+1, width-2, height-2);

	// Render every layer
	for(var layer in dialog.layers){

		var d = {
			width: dialog.layers[layer]['width'],           // The actual width of the item
			height: dialog.layers[layer]['height'],         // The actual height of the item
			loopWidth: 0,       // The cumulating width of the items
			loopHeight: 0,     // The cumulating height of the items
			useWidth: dialog.layers[layer]['width'],        // The width to use for drawing
			useHeight: dialog.layers[layer]['height'],      // The height to use for drawing
			repeatx: 0,
			repeaty: 0,
			repeatv: dialog.layers[layer].repeatv,
			repeath: dialog.layers[layer].repeath,
			offset: dialog.layers[layer].offset,
			wantedWidth: dialog.layers[layer]['width'],
			wantedHeight: dialog.layers[layer]['height']
		}

		if(d.repeath) d.wantedWidth = width;
		if(d.repeatv) d.wantedHeight = height;

		// Calculate the total offset
		d.offsettop = d.offset[0];
		d.offsetright = d.offset[1];
		d.offsetbottom = d.offset[2];
		d.offsetleft = d.offset[3];

		if(dialog.layers[layer].stackw !== undefined) d.offsetleft += stack[dialog.layers[layer].stackw]['width'];
		if(dialog.layers[layer].stackh !== undefined) d.offsettop += stack[dialog.layers[layer].stackh]['height'];

		// Recalculate the wanted sized
		d.wantedWidth = d.wantedWidth - (d.offsetleft + d.offsetright);
		d.wantedHeight = d.wantedHeight - (d.offsettop + d.offsetbottom);

		do {

			todo = 0;

			dx = x + (d.repeatx * d.width) + d.offsetleft;
			dy = y + (d.repeaty * d.height) + d.offsettop;

			k.links.canvas.buffer.drawImage(                // Draw to the buffer
				 tileSet[dialog['tileset']]['image'],       // The image to use
				 dialog.layers[layer]['sx'],               // The source x on the image
				 dialog.layers[layer]['sy'],               // The source y on the image
				 d.useWidth,             // The source width
				 d.useHeight,            // The source height
				 dx,
				 dy,
				 d.useWidth,
				 d.useHeight
			);

			if(d.repeatx == 0) d.loopWidth = d.useWidth;

			if(dialog.layers[layer].repeath) {
				d.wantedWidth -= d.useWidth;
				if(d.repeatx > 0) d.loopWidth += d.useWidth;
				d.repeatx++;
				if(d.wantedWidth < d.useWidth) d.useWidth = d.wantedWidth;
				todo += d.wantedWidth;
			}

			if(d.repeaty == 0) d.loopHeight = d.useHeight;
			
			if(dialog.layers[layer].repeatv) {
				
				d.wantedHeight -= d.useHeight;
				if(d.repeaty > 0) d.loopHeight += d.useHeight;
				d.repeaty++;
				if(d.wantedHeight < d.useHeight) d.useHeight = d.wantedHeight;
				todo += d.wantedHeight;
			}

		}while(todo > 0);

		if(dialog.layers[layer].stackw !== undefined) {
			d.loopWidth += stack[dialog.layers[layer].stackw]['width'];
		}

		if(dialog.layers[layer].stackh !== undefined) {
			d.loopHeight += stack[dialog.layers[layer].stackh]['height'];
		}

		// We'll store how much space everything takes in here, needed for stacks
		stack[layer] = {'width': d.loopWidth, 'height': d.loopHeight};

	}

	k.state.hud.layers.push({"name": "dialog", "width" : width, "height": height, "dx": x, "dy": y, "type": "dialog", "index": index});

}

/**
 *Draw the cursor at the position of the mouse
 */
function drawCursor(){
    //drawTileSpecific("fireball", 1, mouseX, mouseY);

    k.links.canvas.ctx.drawImage(
	     tileSet['pointer']['image'],
	     0,
	     0,
	     19,
	     19,
	     k.links.canvas.mouseX,
	     k.links.canvas.mouseY,
	     19,
	     19
    );

}
