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

canvasCollection = function(width, height){

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
 *Output a message to the echo div if the debugOn variable is true
 *@param message {string} The string you want to show
 *@param counter {bool}   Show how much time has passed since the last debugEcho
 *                        (with counter enabled). Defaults to true.
 */
function debugEcho(message, counter){
    
    if(counter === undefined || counter === true) counter = true;
    
    if(k.settings.debug.DEBUG==true) echo(message, counter);

}

/**
 *Output a message to the echo div if the debugOn variable is true
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
    
    if(debugOn==true && debugHudOn == true) echo(message, counter);

}

/**
 *Output a message to the echo div if the debugPathOn variable is true
 *@param message {string} The string you want to show
 *@param counter {bool}   Show how much time has passed since the last debugEcho
 *                        (with counter enabled). Defaults to true.
 */
function debugPath(message, counter){

    if(counter === undefined || counter === true) counter = true;

    if(debugOn==true && debugPathOn == true) echo(message, counter);

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
        k.links.echo.append(text);
    } else {
        msPassed = (new Date()).getTime() - debugCounter;
	    text='<p>[<span class="ms">'+msPassed.toPrecision(5)+'ms</span>] ' + message + '</p>';
        k.links.echo.append(text);
    
        // Reset debugcounter
        debugCounterReset();
    }

	if(k.state.recording) movie.addDebug(text);
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