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
 *This function is called whenever a key is pressed on the keyboard
 *@param    key     {int}   The key
 */
function onKeyDown(keypress) {
    
    // If the debugCounter is bigger than 1000 this means nothing has happened
    // In a long time. It's best to reset it.
    if(debugCounter > 1000) debugCounterReset();

    // Select the correct key and execute its functions
    switch (keypress.keyCode) {

        case key.Uparrow: // Arrow up
            if((now()-animatedObjects[userPosition.uid]['lastMoved']) > userMoveMsPerTile ) {
                animatedObjects[userPosition.uid]['moveToY']--;
                //userPosition.moveToY--;
                animatedObjects[userPosition.uid]['lastMoved'] = now();
            }
            break

        case key.Rightarrow: // Arrow right
            if((now()-animatedObjects[userPosition.uid]['lastMoved']) > userMoveMsPerTile) {
                animatedObjects[userPosition.uid]['moveToX']++;
                //userPosition.moveToX++;
                animatedObjects[userPosition.uid]['lastMoved'] = now();
            }
            break;

        case key.Downarrow: // Arrow down
            if((now()-animatedObjects[userPosition.uid]['lastMoved']) > userMoveMsPerTile) {
                animatedObjects[userPosition.uid]['moveToY']++;
                //userPosition.moveToY++;
                animatedObjects[userPosition.uid]['lastMoved'] = now();
            }
            break;
        
        case key.Leftarrow: // Arrow left
            if((now()-animatedObjects[userPosition.uid]['lastMoved']) > userMoveMsPerTile) {
                animatedObjects[userPosition.uid]['moveToX']--;
                //userPosition.moveToX--;
                animatedObjects[userPosition.uid]['lastMoved'] = now();
            }
            break;
    }
}
