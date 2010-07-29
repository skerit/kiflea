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
 *Open a connection to the server
 */
function getConnection(){
    
    // If the connectToServer variable is true...
    if(connectToServer == true) {
        
        // Create the connection
        ws = new WebSocket(conAddress + ':' + conPort + '/');
    
        // Setup a few event handlers
        ws.onopen = function(e) {
         console.log('Made connection to ' + conAddress + ':' + conPort + '/');
         out('Opened connection to the server at <b>' + conAddress + ':' + conPort + '/</b>');
         
         // Send our users info
         ws.send($.toJSON(animatedObjects[userPosition.uid]));
        }
        
        ws.onclose = function(e) {
         console.log("The connection to the server has been closed");
         out('The connection to the server has been closed');
        }
        
        // Bij het ontvangen van data ...
        ws.onmessage = function(e) {
         console.log("Received data: " + e.data);
         //out('Received data : ' + e.data);
         
         tempx = animatedObjects[userPosition.uid]['moveToX'];
         tempy = animatedObjects[userPosition.uid]['moveToY'];
         
         try {
            verwerk = JSON.parse(e.data);
            animatedObjects = verwerk;
            //animatedObjects[userPosition.uid]['moveToX'] = tempx;
            //animatedObjects[userPosition.uid]['moveToY'] = tempy;
         } catch (error){
            debugEcho('An error occured receiving data: ' + error);
         }
        }
    }
    
    // Another debug function
    function out(text) {
     debugEcho('[<span style="color:#0000ff">SOCKETS</span>] ' + text);
    }
}