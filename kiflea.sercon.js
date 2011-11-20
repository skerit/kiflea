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

var volledig = 0;
var headerlength = 0;
var vdata;

/**
 *Open a connection to the server
 */
k.operations.getConnection = function() {
	
    /**
	 * Create the connection to the WebSocket server.
	 * Alert() us if anything goes wrong.
	 */
	try {
		k.operations.ws = new WebSocket(k.settings.server.ADDRESS + ':' + k.settings.server.PORT + '/');
	} catch(error) {
		var txt="There was an error connecting to the server.\n\n";
		txt+="Error description: " + err.description + "\n\n";
		txt+="Click OK to continue.\n\n";
		alert(txt);
	}

    /**
	 * Execute this function when the connection to the server is established
	 */
    k.operations.ws.onopen = function(e) {
		
		console.log('Made connection to ' + k.settings.server.ADDRESS + ':' + k.settings.server.PORT + '/');
		
		k.state.server.connected = true;
		
		// Send a message stating we're ready for our data
		k.send({'action': 'logon', 'username': 'guest', 'password': null});
     
    }

	/**
	 * Execute this function when the connection has been closed
	 */
    k.operations.ws.onclose = function(e) {
		
		console.log("The connection to the server has been closed");

		k.state.server.connected = false;
		k.state.server.initiated = false;
		
    }
    
    /**
	 * Execute this function every time we receive data
	 */
    k.operations.ws.onmessage = function(e) {
		
		console.log("Received data: " + e.data);
		
		tempx = animatedObjects[userPosition.uid]['moveToX'];
		tempy = animatedObjects[userPosition.uid]['moveToY'];
     
		try {
			
			debugEcho('Wgetting data, length: ' + e.data.length);
			var receivedData = k.operations.server.parse(e.data);
			
			if(receivedData !== false) {
				
				switch(receivedData['action']){
					
					// The server is letting us now we have been initiated
					case 'initiated':
						
						// Indicate the server has initiated us
						k.state.server.initiated = true;
						
						debugEcho('Server has initiated us! Asking for timesync, started downloading maps');
						
						userPosition.uid = receivedData['userinfo']['uid'];
						animatedObjects[userPosition.uid] = receivedData['userinfo'];
						
						k.operations.load.getMaps(receivedData['loadMaps']);
						
						
						k.send({'action': 'timesync'});
						
						break;
					
					// The server is sending a timesync
					case 'timesync':
						sNow = now();
						sTime = parseInt(receivedData['time']);
						
						timeDifference = timeDifference + (sNow - sTime)
						
						debugEcho('Received this time: ' + sTime + ' -- Local time: ' + sNow + ' -- Difference: ' + timeDifference);
						break;
					
					// The server is telling us to move
					case 'move':
						
						// Add the new path if the user is known to us
						if(animatedObjects[receivedData['from']] !== undefined){
		
							k.actions.moveAccept(receivedData);
							
						} else { // Ask for an initiation of the user if he isn't known
							k.send({'action': 'iniuser', 'who': receivedData['from']});
						}
						
						break;
					
					// Get a specific user
					case 'initiation':
						animatedObjects[receivedData['uid']] = receivedData;
						break;
					
					// Get a complete userlist
					case 'userlist':
						animatedObjects = receivedData['userlist'];
						break;
					
					// A user has logged off, remove him
					case 'logoff':
						delete animatedObjects[receivedData['from']];
						break;
		
				}
				
			}
			
		} catch (error){
			debugEcho('An error occured receiving data: ' + error);
		}
    }
    
}

/**
 * Send an object to the server in JSON form 
 */
k.send = function(object){
	
	// Store the JSON stringified object in here
	var stringified;
	stringified = JSON.stringify(object)
	
	// Create a header string
	var header = "--KOP:" + (stringified.length) + ":POK--";
	
	// Send the header + the stringified object
	k.operations.ws.send(header+stringified);
	
	console.log("Data sent: " + header+stringified);
}

/**
 * Receive data from the server with header and attempt to turn it into an object
 */
k.operations.server.parse = function(data){
    
    // Find the KOP (head) of a message
    if(data.search("--KOP:") > -1){
        
        // If it has one, see if the previous message was received correctly
        // If not, print out a warning
        if(k.state.server.completeget == -1) debugEcho("Previous message was not received properly");
        
        // Splice the data to get the header length
        // (Encased like this: "--KOP:733:POK--")
        var temp = data.split("--KOP:")
        temp = temp[1].split(":POK--")
        var headerlength = temp[0];
        data = temp[1];
        
        // If the length of the data is equal to the length of the header
        // Everything is alright!
        if(data.length == headerlength){
            k.state.server.completeget = 0;
            headerlength = 0;
        } else {
            // If not, store the data in the global "vdata" variable and
            // set "completeget" to -1
            k.state.server.completeget = -1;
            var vdata = data;
        }
    } else { // If there is no "KOP" in the data, it's the second part of something
        debugEcho('Second part of message');
        var vdata = vdata + data;
        if(vdata.length == headerlength){
            k.state.server.completeget = 0;
            var headerlength = 0;
            data = vdata;
        } else {
            volledig = -2;
        }
    }
    
    // If the message is complete, try to get an object out of it and return it
    if(k.state.server.completeget == 0) {
		
		try { // Parse the object
			data = JSON.parse(data);
		} catch (error){ // Set data as false if it fails
			data = false;
		}
		
        return data;
	
    } else {
        return false;
    }
}