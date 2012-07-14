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
 * Record a canvas element in order to play it back later
 * @constructor
 * @param width
 * @param height
 */
CanvasReplay = function(width, height){

	this.collection = [];
	this.width = width;
	this.height = height;
	this.currentFrame = 0;
	this.frames = 0;
	this.debug = '';
	this.loop;

	k.state.recording = true;

	this.addImage = function(canvasElement){
		var index = this.collection.push({'element': document.createElement('canvas'), 'control' : 0, 'debug': 'Nothing'});
		var frame = this.collection[index-1];

		frame.element.width = this.width;
		frame.element.height = this.height;

		frame.control = frame.element.getContext('2d');

		frame.control.drawImage(canvasElement, 0 ,0);

		frame.debug = this.debug;
		this.debug = '';

		this.frames++;
	}

	this.nextFrame = function(jump){

		if(jump > 0) this.currentFrame += jump;
		else this.currentFrame++;

		if(this.currentFrame > this.frames) this.currentFrame = 0;

		this.drawFrame();

		if(this.currentFrame-1 >= 0) {
			k.links.echo.append('<h1>Previous frame:</h1>');
			k.links.echo.html(this.collection[this.currentFrame-1].debug);
		}

		k.links.echo.append('<h1>Current frame:</h1>');
		k.links.echo.append(this.collection[this.currentFrame].debug);

		if(this.currentFrame+1 < this.frames) {
			k.links.echo.append('<h1>Next frame:</h1>');
			k.links.echo.append(this.collection[this.currentFrame+1].debug);
		}

	}

	this.previousFrame = function(jump){
		if(jump > 0) this.currentFrame -= jump;
		this.currentFrame--;

		if(this.currentFrame < 0) this.currentFrame = this.frames;

		this.drawFrame();

		if(this.currentFrame-1 >= 0) {
			k.links.echo.append('<h1>Previous frame:</h1>');
			k.links.echo.html(this.collection[this.currentFrame-1].debug);
		}

		k.links.echo.append('<h1>Current frame:</h1>');
		k.links.echo.append(this.collection[this.currentFrame].debug);

		if(this.currentFrame+1 < this.frames) {
			k.links.echo.append('<h1>Next frame:</h1>');
			k.links.echo.append(this.collection[this.currentFrame+1].debug);
		}
	}

	this.drawFrame = function(){
		k.links.canvas.ctx.drawImage(this.collection[this.currentFrame].element, 0 ,0);
	}

	this.play = function(fps){
		this.loop = window.setInterval(this.playFrame, 1000 / k.settings.engine.fps );
	}

	this.playFrame = function(){
		movie.nextFrame();
	}

	this.addDebug = function(text){
		this.debug += text;
	}


}

/**
 *Get the angle between 2 points
 *@param    sx  {integer}   The x point of origin, probably the users
 *@param    sy  {integer}   The y point of origin, probably the users
 *@param    dx  {integer}   The x point of destination, probably the selection
 *@param    dy  {integer}   The y point of destination, probably the selection
 *@returns  {float}         The degrees
 */
function getAngle(sx,sy,dx,dy){

    var x = (dx - sx);
    var y = (dy - sy);
    
    var theta = Math.atan2(-y, x);
    
    if (theta < 0){
       theta += 2 * Math.PI;
    }
    
    return theta*180/Math.PI;
}

/**
 *Give us a random text
 */
function randString(length) {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var randomstring = '';
	for (var i=0; i<length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}


/**
 *Give us a random number between 1 and the given number
 */
function rand(end){
  return ( Math.floor ( Math.random ( ) * end + 1 ) );
}

/**
 *Give us a random number between these 2 numbers
 */
function randBetween(begin, end){
   
   return rand(end-begin) + begin; 
}

/**
 *A function to send test messages with to the server
 */
function sendTestJson(){
 //var sendme = $.toJSON(animatedObjects);
 //ws.send(sendme);
 debugEcho('Testing: ');
 ws.send(JSON.stringify(animatedObjects[userPosition.uid]));
 debugEcho('Sent: ' + JSON.stringify(animatedObjects[userPosition.uid]));
}

/**
 *Return the direction of an angle
 *@param    degrees     {float}     The degrees
 *@param    text        {bool}      If we want the direction in text
 *@returns  {double or string}      If text is on we get the name of the direction
 */
function getAngleDirection(degrees, text){
    
    // Get the "quadrant", or at least thats what I'm calling it
    var qwhere = halfRound(degrees/90);
    
    if(text === undefined || text == true){
        
        switch(qwhere){

            case 0:
                qwhere = 'right';
                break;
            
            case 0.5:
                qwhere = 'rightup';
                break;
            
            case 1:
                qwhere = 'up';
                break;
            
            case 1.5:
                qwhere = 'leftup';
                break;
            
            case 2:
                qwhere = 'left';
                break;
            
            case 2.5:
                qwhere = 'leftdown';
                break;
            
            case 3:
                qwhere = 'down';
                break;
            
            case 3.5:
                qwhere = 'rightdown';
                break;
            
            case 4:
                qwhere = 'right';
                break;
        }
        
    }
    
    return qwhere;
}

/**
 * Precise
 */
function precise(text){

	text = String(text);

	if(text.indexOf('.00') > 0) {
		text = text.replace('.00', '');
		text = '00' + text;
	}

	if(text.indexOf('.0') > 0) {
		text = text.replace('.0', '');
		text = '0' + text;
	}

	return text;

}

/**
 *Return the half-rounded number (.0 or .5)
 *@param    number      {float}
 */
function halfRound(number) {
    
    // Store the decimal in here
    var decimalNr = decimal(number) * 10;
    
    // Store the floor
    var floor = Math.floor(number);
    
    if (decimalNr == 5) return floor += 0.5;
    
    if ( (decimalNr < 3) || (decimalNr > 7) ) {
        return Math.round(number);
    } else {
        return floor += 0.5;
    }
}

/**
 *Return the decimal part of a number (10.5 becomes 0.5)
 *@param number {float}    The number you want the decimals of
 *@param decimals {int}    The ammount of decimals you want
 *@returns {float} A float between 0 and 1.
 *If no decimals are given, the "userMoveSmoothness" value is used!
 */
function decimal(number, decimals){
    
    if(!decimals) decimals = 5;
    
    
    result = number - Math.floor(number);
    return result.toFixed(decimals);
}

/**
 *Return the current time in milliseconds + the timeDifference with the server
 */
function now(){
    return (new Date()).getTime() - timeDifference;
}

/**
 *Output an associative array to the echo div
 *@param array {array} The array you want to show
 */
function debugArray(array){
    debugEcho('<pre>' + dump(array) + '</pre>');
}

/**
 * Function : dump()
 * Arguments: The data - array,hash(associative array),object
 *    The level - OPTIONAL
 * Returns  : The textual representation of the array.
 * This function was inspired by the print_r function of PHP.
 * This will accept some data as the argument and return a
 * text that will be a more readable version of the
 * array/hash/object that is given.
 * Docs: http://www.openjs.com/scripts/others/dump_function_php_print_r.php
 */
function dump(arr,level) {
	var dumped_text = "";
	if(!level) level = 0;
	
	//The padding given at the beginning of the line.
	var level_padding = "";
	for(var j=0;j<level+1;j++) level_padding += "    ";
	
	if(typeof(arr) == 'object') { //Array/Hashes/Objects 
		for(var item in arr) {
			var value = arr[item];
			
			if(typeof(value) == 'object') { //If it is an array,
				dumped_text += level_padding + "'" + item + "' ...\n";
				dumped_text += dump(value,level+1);
			} else {
				dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
			}
		}
	} else { //Stings/Chars/Numbers etc.
		dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
	}
	return dumped_text;
}

/**
 * Output a message to the frame debug div
 */
function debugFrame(message, counter){
	
	if(counter === undefined || counter === true) counter = true;
	echoFrame(message, counter);
}

/**
 *Output a message to the framedebug div, no matter what
 *@param message {string} The string you want to show
 *@param counter {bool}   Show how much time has passed since the last echo
 *                        (with counter enabled). Defaults to false.
 */
function echoFrame(message, counter){

	var text;

    if(counter === undefined || counter === false) {
	    text = '<p>[<span class="msi">--INFO--</span>] ' + message + '</p>';
		k.links.framedebug.innerHTML = text + k.links.framedebug.innerHTML;
    } else {
        msPassed = (new Date()).getTime() - k.state.debug.counter;
	    text='<p>[<span class="ms">'+msPassed.toPrecision(5)+'ms</span>] ' + message + '</p>';
        k.links.framedebug.innerHTML = text + k.links.framedebug.innerHTML;
    
        // Reset debugcounter
        debugCounterReset();
    }

	if(k.state.recording) movie.addDebug(text);
}

/**
 *Output a message to the echo div if the k.settings.debug.DEBUG variable is true
 *@param message {string} The string you want to show
 *@param counter {bool}   Show how much time has passed since the last debugEcho
 *                        (with counter enabled). Defaults to true.
 */
function debugEcho(message, counter){
    
    if(counter === undefined || counter === true) counter = true;
    
    if(k.settings.debug.DEBUG==true) echo(message, counter);

}

/**
 *Output a message to the echo div if the k.settings.debug.DEBUG variable is true
 *AND we're using a low fps (smaller than 5)
 *@param message {string} The string you want to show
 *@param counter {bool}   Show how much time has passed since the last debugEcho
 *                        (with counter enabled). Defaults to true.
 */
function debugEchoLfps(message, counter){
    
    if(counter === undefined || counter === true) counter = true;
    
    if(k.settings.debug.DEBUG==true && k.settings.engine.fps <= 5) echo(message, counter);

}

/**
 *Output a message to the echo div if the debugMovement variable is true
 *@param message {string} The string you want to show
 *@param counter {bool}   Show how much time has passed since the last debugEcho
 *                        (with counter enabled). Defaults to true.
 */
function debugMove(message, counter){
    
    if(counter === undefined) counter = true;
    
    if(k.settings.debug.DEBUG && k.settings.debug.MOVEMENT) echo(message, counter);

}

/**
 *Output a message to the echo div if the debugHudOn variable is true
 *@param message {string} The string you want to show
 *@param counter {bool}   Show how much time has passed since the last debugEcho
 *                        (with counter enabled). Defaults to true.
 */
function debugHud(message, counter){
    
    if(counter === undefined || counter === true) counter = true;
    
    if(k.settings.debug.DEBUG==true && debugHudOn == true) echo(message, counter);

}

/**
 *Output a message to the echo div if the debugPathOn variable is true
 *@param message {string} The string you want to show
 *@param counter {bool}   Show how much time has passed since the last debugEcho
 *                        (with counter enabled). Defaults to true.
 */
function debugPath(message, counter){

    if(counter === undefined || counter === true) counter = true;

    if(k.settings.debug.DEBUG==true && debugPathOn == true) echo(message, counter);

}

/**
 *Output a message to the echo div, no matter what
 *@param message {string} The string you want to show
 *@param counter {bool}   Show how much time has passed since the last echo
 *                        (with counter enabled). Defaults to false.
 */
function echo(message, counter){

	var text;

    if(counter === undefined || counter === false) {
	    text = '<p>[<span class="msi">--INFO--</span>] ' + message + '</p>';
		k.links.echo.innerHTML = text + k.links.echo.innerHTML;
    } else {
        msPassed = (new Date()).getTime() - k.state.debug.counter;
	    text='<p>[<span class="ms">'+msPassed.toPrecision(5)+'ms</span>] ' + message + '</p>';
        k.links.echo.innerHTML = text + k.links.echo.innerHTML;
    
        // Reset debugcounter
        debugCounterReset();
    }

	if(k.state.recording) movie.addDebug(text);
}

/**
 * Only output this message once by its ID
 * This will prevent flooding of debug messages
 * @param	{string}	message		The message to output
 * @param	{string}	id			The id of the message
 */
function echoOnce(message, id){
	
	if(k.state.debug.once[id] !== undefined) return;
	
	echo(message);
	k.state.debug.once[id] = {'when': now(), 'message': message};
}

/**
 * Only output this message to console once by its ID
 * This will prevent flooding of debug messages
 * @param	{string}	message		The message to output
 * @param	{string}	id			The id of the message
 */
function logOnce(message, id){
	
	if(k.state.debug.once['console' + id] !== undefined) return;
	
	console.log(message);
	k.state.debug.once['console' + id] = {'when': now(), 'message': message};
}

/**
 *Reset the debugCounter if you feel like it's needed.
 */
function debugCounterReset(){
    debugCounter = (new Date()).getTime();
}

/**
 *Replace the debug text under the canvas.
 *Constantly being overwritten by renderLoop, so you can't actually use this.
 *@param message {string} The string you want to show
 */
function debug(message){
    debugOutput.html('<p>' + message + '</p>');
}

/**
 *Javascript is missing a trim function, this will do that
 *@param    value   {string}
 *@returns  {string}    The string without leading or trailing spaces
 */
function trim(value) {
  value = value.replace(/^\s+/,'');
  value = value.replace(/\s+$/,'');
  return value;
}

/**
 *Make a copy of an object, so we can use it regulary and not by reference
 *@param    obj     {object}    // The object you want
 *@returns  {object}            // The same object, but modifyable
 */
function deepCopy(obj) {
    if (typeof obj !== "object") return obj;

    var retVal = new obj.constructor();
    for (var key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        retVal[key] = deepCopy(obj[key]);
    }
    return retVal;
}

/**
 * Allows you to time something
 */
function benchTime(){

	if(k.settings.debug.DEBUG==false) return;

	this.begin = now();

	this.end = function(type){
		if(typeof(type) == "string"){
			echo('Benchmark timer "' + type + '" completed in ' + (now() - this.begin) + 'ms');
		} else {
			return (now() - this.begin);
		}
	}
}

/**
 * Recursively merge properties of two objects (modifies the original obj1 when not passed as a deepcopy!)
 */
merge = function(obj1, obj2) {

  for (var p in obj2) {
    try {
      // Property in destination object set; update its value.
      if ( obj2[p].constructor==Object ) {
        obj1[p] = MergeRecursive(obj1[p], obj2[p]);

      } else {
        obj1[p] = obj2[p];

      }

    } catch(e) {
      // Property in destination object not set; create it and set its value.
      obj1[p] = obj2[p];

    }
  }

  return obj1;
}

/**
 * Get the right part of a string delimited by delim
 */
right = function(string, delim) {
	return string.substr(string.lastIndexOf(delim) + 1);
}

/**
 * Get the average of an array
 */
function mean(numbers) {
    // mean of [3, 5, 4, 4, 1, 1, 2, 3] is 2.875
    var total = 0,
        i;
    for (i = 0; i < numbers.length; i += 1) {
        total += numbers[i];
    }
    return total / numbers.length;
}

function median(numbers) {
    // median of [3, 5, 4, 4, 1, 1, 2, 3] = 3
    var median = 0,
        numsLen = numbers.length;
    numbers.sort();
    if (numsLen % 2 === 0) { // is even
        // average of two middle numbers
        median = (numbers[numsLen / 2 - 1] + numbers[numsLen / 2]) / 2;
    } else { // is odd
        // middle number only
        median = numbers[(numsLen - 1) / 2];
    }
    return median;
}
function mode(numbers) {
    // as result can be bimodal or multimodal,
    // the returned result is provided as an array
    // mode of [3, 5, 4, 4, 1, 1, 2, 3] = [1, 3, 4]
    var modes = [],
        count = [],
        i,
        number,
        maxIndex = 0;
    for (i = 0; i < numbers.length; i += 1) {
        number = numbers[i];
        count[number] = (count[number] || 0) + 1;
        if (count[number] > maxIndex) {
            maxIndex = count[number];
        }
    }
    for (i in count) if (count.hasOwnProperty(i)) {
        if (count[i] === maxIndex) {
            modes.push(Number(i));
        }
    }
    return modes;
}
function range(numbers) {
    // range of [3, 5, 4, 4, 1, 1, 2, 3] is [1, 5]
    numbers.sort();
    return [numbers[0], numbers[numbers.length - 1]];
}

/**
 * Sector browser
 * @param	{integer}	A sector number
 */
k.debug.drawSector = function(sectornumber) {

	dc.clearRect(0, 0, 480, 480);
	
	var nr = 1;
	var nry = 0;
	map = k.sel.map.name;
	
	// Loop through every layer
	for (var layer in k.cache.map[map]){
		
		if (k.cache.map[map][layer][sectornumber] !== undefined){
			
			// Draw a full image here
			dc.drawImage(k.cache.map[map][layer][sectornumber]['element'], 10-k.sel.map.tileWidth, 10-k.sel.map.tileHeight);
			
			// And separate layers over the rest of the canvas
			var x = 10 + 10*nr + (nr * k.settings.engine.SECTORSIZE * 32);
			var y = 10 + 10*nry + (nry * k.settings.engine.SECTORSIZE * 32);
			dc.fillStyle = 'rgba(100,100,100,0.6)';
			dc.fillRect(x, y, k.settings.engine.SECTORSIZE * 32, k.settings.engine.SECTORSIZE * 32)
			dc.drawImage(k.cache.map[map][layer][sectornumber]['element'], x-k.sel.map.tileWidth, y-k.sel.map.tileHeight);
			
			// Get the dirty tiles
			var fade = k.cache.map[map][layer][sectornumber].fade.tiles;
			
			// Draw dirtyness
			for(var tile in fade){
				var opa = fade[tile]/100;

				dc.fillStyle = 'rgba(255,0,0,' + opa + ')';
				
				var tx = 10 + (tile % k.settings.engine.SECTORSIZE) * 32;
				var ty = 10 + ~~(tile/k.settings.engine.SECTORSIZE) * 32;
				dc.fillRect(tx, ty, 32, 32);
			}
		}
		

		nr++;
		
		if(nr == 3) {
			nr = 0;
			nry++;
		}
	}
	
	//sector = k.links.getSector(k.links.getTileByCanvas(x, y,"Ground")['coord'], k.links.getTileByCanvas(0,0,"Ground")["layer"]);
	//dc.drawImage(sector.element, 100, 100);
}

/**
 * A simple string hashing function
 * @param	{string}	string
 * @returns	{integer}	A hash number
 */
k.debug.hash = function(string) {
	
	var res = 0,
		len = string.length;
	
	var numbers = '';
		
	for (var i = 0; i < len; i++) {
		res = res * 31 + string.charCodeAt(i);
		
		var chr = string.substring(i, i+1);
		
		// This didn't make it unique enough, prepend numbers
		if(!isNaN(chr) && chr !== ' '){
			numbers += string.substring(i, i+1).toString();
		}
	}
	
	res = numbers.toString() + res.toString();
	
	return res;
}

/**
 * Get information on the function's caller
 * 
 * @returns {Object}
 */
k.debug.callerInfo = function(){
	
    try {
		throw Error('');
	} catch(err) {
		
		var caller_line = err.stack.split("\n")[4];
		var index = caller_line.indexOf("at ");
		var clean = caller_line.slice(index+2, caller_line.length);
		
		var last = clean.substring(0, clean.lastIndexOf(':'));
		var line = last.substring(last.lastIndexOf(':')+1, last.length);
		
		var callerName = clean.substring(0, clean.indexOf('('));
		
		var isModule = callerName.indexOf('Object.');
		
		if (isModule > -1) {
			callerName = callerName.substring(isModule+7, callerName.length);
		}
		
		return {
			error: err,
			stack: err.stack,
			callerName: trim(callerName),
			line: line
		}
	}
}

/**
 * Log an error
 */
k.debug.log = function(message, error, id){
	
	if(!k.settings.debug.HTML) return;
	
	var info = k.debug.callerInfo();
	
	if(id === undefined) id = k.debug.hash(info.callerName + message);
	if(error === undefined) {
		error = {'message': '',
				 'number': ''};
	}
	
	if(k.state.debug.messages[id] === undefined){
		
		k.state.debug.messages[id] = {
			id: id,
			count: 0,
			message: message,
			from: {
				name: info.callerName,
				line: info.line,
				code: arguments.callee.caller,
				stack: info.stack
			},
			error: {'message': error.message,
					'number': error.number}
		}
		
		var output = '<p id="p' + id + '" class="one">[<span id="count' + id + '" class="msi"></span>] [' + info.callerName + ':' + info.line + '] ' + message + '</p>';
		
		// Add the error to the output
		k.links.echo.innerHTML = output + k.links.echo.innerHTML;
	}
	
	k.state.debug.messages[id].count++;
	
	var cspan = document.getElementById('count'+id);
	
	var cp = document.getElementById('p'+id);
	
	if(k.state.debug.messages[id].count == 2) cp.className = 'two';
	
	cspan.innerHTML = k.state.debug.messages[id].count;
	
}

/**
 * Load settings from localStorage
 */
k.debug.applyLocalSettings = function() {
	
	var settings = k.debug.getLocalSettings();
	
	if(settings){
		k.settings = settings;
	}
}

/**
 * Get local settings
 */
k.debug.getLocalSettings = function() {
	
	var allsettingsJSON = window.sessionStorage.getItem("settings");
	if(typeof allsettingsJSON == 'string') var allsettings = JSON.parse(allsettingsJSON);
	else allsettings = false;
	
	return allsettings;
}

/**
 * Show the settings
 */
k.debug.showSettings = function() {
	
	var html = '<div class="debugsettings">';
	
	var renderGroup = function(group, settingsgroup, childnr, parentgroupid) {
		
		var id = group-' + group + '-' + childnr + ';
		var html = '<div id="' + id + '" class="group" data-group="' + group + '"><h3>' + group + '</h3>';
		
		for (var setting in k.settings[group]){
			
			var inputType;
			var checked = '';
			
			if (typeof k.settings[group][setting] == 'string') inputType = 'text';
			else if (typeof k.settings[group][setting] == 'number') inputType = 'number';
			else if (typeof k.settings[group][setting] == 'object') inputType = 'object';
			else if (typeof k.settings[group][setting] == 'boolean') {
				inputType = 'checkbox';
				if(k.settings[group][setting]) checked = 'checked';
				else checked = '';
			}
			
			if (inputType == 'text' || inputType == 'number' || inputType == 'checkbox'){
				html += '<label><input type="' + inputType + '" data-group="'
								+ group + '" data-child="' + childnr + '" data-parent="' + parentgroupid + '" data-setting="' + setting
								+ '" class="debugsetting" value="' + k.settings[group][setting] + '" ' + checked + '></input>' + setting + '</label><br/>'
			} else {
				//html += '<label><input type="text" disabled></input>' + setting + '</label><br/>';
				//console.log('rendering subgroup: ' + k.settings[group][setting]);
				//renderGroup(setting, k.settings[group][setting], childnr+1, id);
			}
			
		}
		
		html += '</div>';
		return html;
	}
	
	for (var group in k.settings){
		html += renderGroup(group, k.settings[group], 0);
	}
	
	html += '<br/><button id="savesettings">Save</button></div>';
	
	$('body').append(html);
	$('#savesettings').click(function() {
		
		var allsettingsJSON = window.sessionStorage.getItem("settings");
		if(typeof allsettingsJSON == 'string') var allsettings = JSON.parse(allsettingsJSON);
		else var allsettings = deepCopy(k.settings);
		
		$('.debugsetting').each(function(index, value){
			$i = $(value);
			var type = $i.attr('type');
			var group = $i.attr('data-group');
			var setting = $i.attr('data-setting');
			var settingvalue = $i.attr('value');
			
			if(type == 'text')	{
				allsettings[group][setting] = settingvalue;
			}
			else if(type == 'number'){
				allsettings[group][setting] = parseInt(settingvalue);
			}
			else {
				
			}
			
		});
		
		window.sessionStorage.setItem("settings", JSON.stringify(allsettings));
		k.debug.applyLocalSettings();
		
		$('.debugsettings').remove();
	});

}
