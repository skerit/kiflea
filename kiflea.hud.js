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
    $.getJSON(k.settings.engine.BASEURL + loadHud, function(data) {
		k.collections.hudLayers = data;	// Store the data
	    k.collections.hud = data;
		k.state.load.loadedHud = true;
        debugHud('Hud has been loaded succesfully', false);
	    //k.operations.interface.openScreen('hud');
	    k.operations.interface.openScreen('login');

	    testd = new k.classes.Dialog(k.collections.hud.screens.test, k.links.canvas);

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

	testd.draw();

}

/**
 *  Get the hud item at the specified position, all the way down to the smallest widget
 *  @param	x	{int}
 *  @param	y	{int}
 *  @returns	{object|boolean}		The layer we've clicked, or false if there's nothing there
 */
k.operations.interface.getHudItem = function(x, y){

	// The widget will be stored here later
	var w = false;

	// What dialog did we click?
	var d = k.operations.interface.getDialog(x, y);

	// If we did click a dialog, determine if we also clicked a widget in it
	if(d) {
		d.dialogindex = d.index;
		w = k.operations.interface.getDialogWidget(d.index, x, y);

		if(w){
			w.dialogindex = d.dialogindex;
			w.dialog = deepCopy(d);
			d = w;
		} else {
			if(!k.state.hud.openedDialogs[d.index].clickable) d = false;
		}
	}
	
	return d;

}

/**
 *  Get the index number of the dialog we've clicked (even if it's not clickable)
 *  @param	x	{int}
 *  @param	y	{int}
 *  @returns	{object|boolean}		The layer we've clicked, or false if there's nothing there
 */
k.operations.interface.getDialog = function(x, y){

	// Declarations
	var v = k.state.hud.layers;     // A by-reference link to the current visible hud layers
	var returnObject = false;	    // The value to return
	var vl;                         // A by-reference link to the layer we inspect in the for-loop

	// Loop through the layers, even if we've already found a match (because
	// you can only click on the top layer, which comes last in this case)
	for(var layer = 0; layer < v.length; layer++){

		// Create a link to the current layer we're inspecting
		vl = v[layer];

		// Calculate 'til what X and Y location this element goes
		var endX = vl.dx + vl.width;
		var endY = vl.dy + vl.height;
	
		// Now see if our clicked X and Y coordinates fall in between these ranges
		if((x >= vl.dx && x <= endX) && (y >= vl.dy && y <= endY)){

			// Save it for sending later with deepCopy (as to not send it by reference)
			returnObject = deepCopy(vl);

			// Calculate where we clicked the object
			returnObject.clickedX = x - vl.dx;
			returnObject.clickedY = y - vl.dy;

		}
	}

	return returnObject;

	/** This function should only return the element we clicked, not what's in it!
	 * @deprecated
	 *
	// If the type of value we're gonna return is an object we did find something
	if(typeof(returnObject) == 'object'){

	   // If we're on a dialog window, determine if we're also on a widget in that dialog window
		if(returnObject.type == 'dialog'){
			var widget = k.operations.interface.getDialogWidget(returnObject.index, x, y);

			// If we ARE on a widget, change the type to "dialogwidget" and add the correct widget to the returnobject
			if(widget) {
				returnObject.type = "dialogwidget";
				returnObject.dialogwidget = widget;
			}
		}
	}*/

}

/**
 *Detect if there's a hud item where we've clicked
 * @param   dialogIndex {int}   The index nr of the dialog we clicked
 * @param	x	        {int}   The x position of the mouse in the entire canvas
 * @param	y   	    {int}   The y position of the mouse in the entire canvas
 * @returns	{object|boolean}		    False if no widget was clicked, or the widget
 */
k.operations.interface.getDialogWidget = function(dialogIndex, x, y){

	// The default return value is false
	var returnValue = false;

	// If this opened dialog does contain widgets (content)
	if(k.state.hud.openedDialogs[dialogIndex].content !== undefined){

		// First get the dialog itself
		var d = k.state.hud.openedDialogs[dialogIndex];
		var dc = d.content;     // Now get the widgets

		// Calculate the x and y positions the mouse is on INSIDE the dialog
		var internalX = x - d.x;
		var internalY = y - d.y;

		// Loop through every widget
		for(var widget in dc){

			// Calculate 'till what x and y position the widget goes
			var endX = dc[widget].x + dc[widget].width;
			var endY = dc[widget].y + dc[widget].height;

			// If the mouse is between the starting and ending point, we're on this widget
			if((internalX >= dc[widget].x && internalX <= endX) && (internalY >= dc[widget].y && internalY <= endY)){

				// Set the index for the widget
				dc[widget].index = widget;
				
				// Set this widget as the return value
				returnValue = deepCopy(dc[widget]);

				returnValue.type = "widget";
			}
		}
	}

	return returnValue;
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
 * Open a new dialog and return the index number in the openedDialogs collection
 * Can be used just to get a new index number and then overwrite it.
 */
k.operations.interface.openDialog = function(dialogset, x, y, width, height){

	var index = k.state.hud.openedDialogs.push({'dialogset': dialogset, 'x': x, 'y': y, 'width': width, 'height': height});

	k.state.hud.openedDialogs[index-1]['index'] = index-1;

	return  index-1;
}

/**
 * Create a new dialog window based on a predefined screen
 */
k.operations.interface.openScreen = function(screenName, x, y){

	if(x === undefined) x = 0;
	if(y === undefined) y = 0;

	if(k.collections.hudLayers.screens[screenName] !== undefined){
		var screen = k.collections.hudLayers.screens[screenName];

		// Open an empty dialog and get its index number
		var index = k.operations.interface.openDialog();

		// Now add the widgets to the opened dialog
		k.state.hud.openedDialogs[index] = deepCopy(screen);

		// Set the x and y coordinate
		k.state.hud.openedDialogs[index].x = x;
		k.state.hud.openedDialogs[index].y = y;

	}

}

/**
 * Move a window
 * @param dialogObject {object}     A non-referenced copy of the dialogObject
 */
k.operations.interface.moveDialog = function(dialogObject, x, y){

	if(typeof(dialogObject) == 'object') {
		if(dialogObject.type == "dialog" && k.state.hud.openedDialogs[dialogObject.index].moveable) {
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

	// Calculate the width and height if they're percentages
	if(width.indexOf('%') > 0) width = k.links.canvas.width * (parseInt(width.replace('%', '')) / 100);

	if(height.indexOf('%') > 0) height = k.links.canvas.height * (parseInt(height.replace('%', '')) / 100);

    // Get the wanted dialog information
    var dialog = k.collections.hudLayers['dialog'][dialogset];

	// Keep track of how much space everything takes
	var stack = {};

	// Blur the background if it's wanted
	if(dialog.blur){
		var result = k.operations.interface.blurCanvas(k.links.canvas.bufferElement, x, y, width, height, dialog.blur);
		k.links.canvas.buffer.drawImage(result.element, result.x, result.y);
	}

	// Draw the background rectangle
	if(dialog.fillstyle) {
		k.links.canvas.buffer.fillStyle = dialog.fillstyle;
		k.links.canvas.buffer.fillRect(x+1, y+1, width-2, height-2);
	}

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

	// And now you draw the widgets on this dialog screen
	for(var widgets in k.state.hud.openedDialogs[index]['content']){
		myWidget = k.state.hud.openedDialogs[index]['content'][widgets];

		// Calculate the absolute x & y positions
		myWidget.cx = myWidget.x+x;
		myWidget.cy = myWidget.y+y;

		k.operations.interface.drawWidget(myWidget);
	}


}

/**
 * Blur a canvas
 * @param   {object}    sourceElement   The canvas source element to blur
 * @param   {int}       x               The starting x position on this canvas
 * @param   {int}       y               The starting y position on this canvas
 * @param   {int}       width           The width to blur
 * @param   {int}       height          The height to blur
 * @param   {int}       blurAmount      The number of steps to blur
 * @return  {object}    An object containing element, x, and y ready to be draw on another canvas
 */
k.operations.interface.blurCanvas = function(sourceElement, x, y, width, height, blurAmount){

	// Blur dialog background
	if(x < 0){
		blurWidth = width + x  - blurAmount;
		blurX = 0;
	} else {

		if((x+width) > k.links.canvas.width) {
			blurWidth = width - ((x+width)-k.links.canvas.width) - (blurAmount/2);
			blurX = x;
		} else {
			blurWidth = width  - (blurAmount/2);
			blurX = x;
		}
	}

	if(y < 0) {
		blurHeight = height + y  - blurAmount;
		blurY = 0;
	} else {
		if((y+height) > k.links.canvas.height){
			blurHeight = height - ((y+height) - k.links.canvas.height)  - (blurAmount/2);
			blurY = y;
		} else {
			blurHeight = height  - (blurAmount/2);
			blurY = y;
		}
	}

	// Test blur background
	var tEl = document.createElement('canvas');
	tEl.width = width;
	tEl.height = height;

	tBuf = tEl.getContext('2d');

	tBuf.drawImage(sourceElement, blurX, blurY, blurWidth, blurHeight, 0, 0, blurWidth, blurHeight);


	//tBuf.putImageData(k.links.canvas.buffer.getImageData(x, y, width, height));

	blur(tBuf, tEl, blurAmount);

	return {'element': tEl, 'x': blurX, 'y': blurY};

}
/**
 * Draw a widget
 */
k.operations.interface.drawWidget = function (widget){

	// Create a link to the buffer
	var b = k.links.canvas.buffer;

	if(k.collections.hudLayers.widgets[widget.widget] !== undefined) {
		b.fillStyle = k.collections.hudLayers.widgets[widget.widget].fillstyle;
		b.fillRect(widget.cx, widget.cy, widget.width, widget.height);

		if(widget.value !== undefined){
			b.font = "10pt Courier";
			b.fillStyle = "rgba(0,0,0,1)";

			var tempValue = widget.value;

			while(b.measureText(tempValue).width > (widget.width-4)){
				tempValue = tempValue.substr(1);
			}

			b.fillText(tempValue,  widget.cx+2,  widget.cy+widget.height-2);
		}
	}
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


/**
 * A dialog class
 * @constructor
 * @param   {object|undefined}          parameters          An object with extra parameters
 * @param   {object}                    canvas              The canvas object to use (made with our constructor)
 * @param   {string|boolean|undefined}  windowStyle         The style to use, or false
 * @param   {int|string|undefined}      x                   The wanted starting x position of the dialog
 * @param   {int|string|undefined}      y                   The wanted starting y position of the dialog
 * @param   {int|string}                width               The wanted width of the dialog
 * @param   {int|string}                height              The wanted height of the dialog
 */
k.classes.Dialog = function(parameters, canvas, windowStyles, x, y, width, height) {

	this.inst = {};         // Store the original instructions in here
	this.calc = {};         // Store the calculations of every draw in here
	this.canvas = canvas;   // A link to the canvas object
	this.z = 0;             // The z-layer
	this.ztime = now();     // When the z-layer was last changed

	// Get the basic instructions from the parameters if they exist there
	this.inst.x = parameters.x ? parameters.x : x;
	this.inst.y = parameters.y ? parameters.y : y;
	this.inst.width = parameters.width ? parameters.width : width;
	this.inst.height = parameters.height ? parameters.height : height;
	this.inst.style = parameters.style ? parameters.style : windowStyles;
	this.inst.blur = parameters.blur ? parameters.blur : 4;

	// Calculated info
	this.calc.style = {};
	this.calc.width = this.inst.width;
	this.calc.height = this.inst.height;
	this.calc.x = this.inst.x;
	this.calc.y = this.inst.y;

	// Store the windowStyles
	if(typeof(this.inst.style) == "array") {
		for(var style in this.inst.style){
			if(k.collections.hud.styles[this.inst.style[style]] !== undefined) merge(this.calc.style, k.collections.hud.styles[this.inst.style[style]]);
		}
	} else {
		this.calc.style = k.collections.hud.styles[this.inst.style] !== undefined ? deepCopy(k.collections.hud.styles[this.inst.style]) : false;
	}

	// A dialog window is always clickable, unless otherwise defined in the parameters
	this.inst.clickable = parameters.clickable === undefined ? true : parameters.clickable;

	// A dialog window is always moveable, unless otherwise defined in the parameters
	this.inst.moveable = parameters.moveable === undefined ? true : parameters.moveable;

	// Draw the entire thing
	this.draw = function() {
		this.recalculate();
		this.blur();
		this.decorate();
	}

	// Recalculate certain variables
	this.recalculate = function(){

		this.calc.width = this.inst.width;
		this.calc.height = this.inst.height;
		this.calc.x = this.inst.x;
		this.calc.y = this.inst.y;

		// Calculate the width and height if they're percentages
		if(this.calc.width.indexOf('%') > 0) this.calc.width = this.canvas.width * (parseInt(this.calc.width.replace('%', '')) / 100);
		if(this.calc.height.indexOf('%') > 0) this.calc.height = this.canvas.height * (parseInt(this.calc.height.replace('%', '')) / 100);

		// Calculate the x and y if they're percentages
		if(this.calc.x.indexOf('%') > 0) {
			this.calc.x = (this.canvas.width * (parseInt(this.calc.x.replace('%', '')) / 100)) - (this.calc.width / 2);
		}

		if(this.calc.y.indexOf('%') > 0) {
			this.calc.y = (this.canvas.height * (parseInt(this.calc.y.replace('%', '')) / 100)) - (this.calc.height / 2);
		}
	}

	// Blur the background if it's wanted
	this.blur = function() {
		if(this.calc.style.blur){
			var result = k.operations.interface.blurCanvas(this.canvas.bufferElement, this.calc.x, this.calc.y, this.calc.width, this.calc.height, this.inst.blur);
			this.canvas.buffer.drawImage(result.element, result.x, result.y);
		}
	}

	// Draw the decorations
	this.decorate = function() {

		var dialog = this.calc.style;
		var stack = {};

		// Draw the background rectangle
		if(dialog.fillstyle) {
			this.canvas.buffer.fillStyle = dialog.fillstyle;
			this.canvas.buffer.fillRect(this.calc.x+1, this.calc.y+1, this.calc.width-2, this.calc.height-2);
		}

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

			if(d.repeath) d.wantedWidth = this.calc.width;
			if(d.repeatv) d.wantedHeight = this.calc.height;

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

				dx = this.calc.x + (d.repeatx * d.width) + d.offsetleft;
				dy = this.calc.y + (d.repeaty * d.height) + d.offsettop;

				this.canvas.buffer.drawImage(                // Draw to the buffer
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

	}

}