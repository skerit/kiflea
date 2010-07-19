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
 *Return the current time in milliseconds
 */
function now(){
    return (new Date()).getTime();
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
    
    if(debugOn==true) echo(message, counter);

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
    
    if(debugOn==true && fps < 5) echo(message, counter);

}

/**
 *Output a message to the echo div if the debugMovement variable is true
 *@param message {string} The string you want to show
 *@param counter {bool}   Show how much time has passed since the last debugEcho
 *                        (with counter enabled). Defaults to true.
 */
function debugMove(message, counter){
    
    if(counter === undefined || counter === true) counter = true;
    
    if(debugOn==true && debugMovement == true) echo(message, counter);

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
 *Output a message to the echo div, no matter what
 *@param message {string} The string you want to show
 *@param counter {bool}   Show how much time has passed since the last echo
 *                        (with counter enabled). Defaults to false.
 */
function echo(message, counter){

    if(counter === undefined || counter === false) {
        echoOutput.append('<p>[<span class="msi">--INFO--</span>] ' + message + '</p>');
    } else {
        msPassed = (new Date()).getTime() - debugCounter;
        echoOutput.append('<p>[<span class="ms">'+msPassed.toPrecision(5)+'ms</span>] ' + message + '</p>');    
    
        // Reset debugcounter
        debugCounterReset();
    }
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
