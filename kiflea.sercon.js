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
function getConnection(){
        
    // Create the connection
	try {
		ws = new WebSocket(k.settings.server.ADDRESS + ':' + k.settings.server.PORT + '/');
	} catch(error) {
		
	}

    // Setup a few event handlers
    ws.onopen = function(e) {
     console.log('Made connection to ' + k.settings.server.ADDRESS + ':' + k.settings.server.PORT + '/');
     out('Opened connection to the server at <b>' + k.settings.server.ADDRESS + ':' + k.settings.server.PORT + '/</b>');
     k.state.server.connected = true;
     // Send our users info
     wsend(animatedObjects[userPosition.uid]);
     
    }

    ws.onclose = function(e) {
     console.log("The connection to the server has been closed");
     out('The connection to the server has been closed');
     wsend({'action': 'quit'});
	 k.state.server.connected = false;
     //wsend({"uid": userPosition.uid, "map":"close"});
	 
	 // We didn't connect, restart in offline mode
	 k.settings.server.CONNECT = false;
	 k.operations.startEngine();
    }
    
    // Bij het ontvangen van data ...
    ws.onmessage = function(e) {
     console.log("Received data: " + e.data);
     //out('Received data : ' + e.data);
     
     tempx = animatedObjects[userPosition.uid]['moveToX'];
     tempy = animatedObjects[userPosition.uid]['moveToY'];
     
     try {
        
        debugEcho('Wgetting data, length: ' + e.data.length);
        receivedData = wget(e.data);
        
        if(receivedData !== false) {
            verwerk = JSON.parse(receivedData);
            
            debugEcho(verwerk['action'])
            
            switch(verwerk['action']){
                case 'initiated':
                    debugEcho('Server has initiated us! Asking for timesync, started downloading maps');
                    k.operations.load.getMaps(verwerk['loadMaps']);
                    k.operations.startLoop();
                    wsend({'action': 'timesync'});
                    break;
                case 'timesync':
                    sNow = now();
                    sTime = parseInt(verwerk['time']);
                    
                    timeDifference = timeDifference + (sNow - sTime)
                    
                    debugEcho('Received this time: ' + sTime + ' -- Local time: ' + sNow + ' -- Difference: ' + timeDifference);
                    break;
                
                case 'move':
                                            
                                            // Add the new path if the user is known to us
                                            if(animatedObjects[verwerk['from']] !== undefined){

	                                            	// The gap between the current (next) and the previous (now) step.
													//verwerk.moveGap = stepFut.moveBegin - stepNext.moveEnd;

                                                    animatedObjects[verwerk['from']]['path'].push(verwerk);
                                            } else { // Ask for an initiation of the user if he isn't known
                                                    wsend({'action': 'iniuser', 'who': verwerk['from']});
                                            }
                    
                    break;
                
                case 'initiation':
                    animatedObjects[verwerk['uid']] = verwerk;
                    break;
                
                case 'userlist':
                    animatedObjects = verwerk['userlist'];
                    break;
                                    
				case 'logoff':
						delete animatedObjects[verwerk['from']];
						break;

            }
            
            /*
            for(var objectId in verwerk){

                if(verwerk[objectId]['path'] !== undefined) {
                    
                    for(var path = 0; path < verwerk[objectId]['path'].length; path++){
                        
                        if(verwerk[objectId]['path'][path]['x'] !== undefined && animatedObjects[objectId] !== undefined) {
                            
                            //    if(animatedObjects[objectId]['lastMoved'] < verwerk[objectId]['lastMoved']){
                            //        debugEcho('Replacing ' + objectId);
                            //        animatedObjects[objectId] = verwerk[objectId];
                            //    }

                            if(animatedObjects[objectId]['path'][ (animatedObjects[objectId]['path'].length-1) ] !== undefined){
                                if(verwerk[objectId]['path'][path]['added'] > animatedObjects[objectId]['path'][ (animatedObjects[objectId]['path'].length-1) ]['added']){
                                    debugEcho('Path is new');
                                    animatedObjects[objectid]['path'].push(path);
                                }
                            }else {


                            }

                        } else {
                            // If the objectId does not exist yet, add it to the array completely
                            if(animatedObjects[objectId] == undefined) {
                                debugEcho("User nr " + objectId + " has been added");
                                animatedObjects[objectId] = verwerk[objectId];
                            }
                        }
                    }
                    
                }
                //animatedObjects[objectId]['path'] = verwerk[objectId]['path'];
            }*/

            //animatedObjects = verwerk;    
        }
        
        ////animatedObjects[userPosition.uid]['moveToX'] = tempx;
        ////animatedObjects[userPosition.uid]['moveToY'] = tempy;
     } catch (error){
        debugEcho('An error occured receiving data: ' + error);
     }
    }
    
    // Another debug function
    function out(text) {
        debugEcho('[<span style="color:#0000ff">SOCKETS</span>] ' + text);
    }
}

/**
 *Send with header
 */
function wsend(message){
    message = JSON.stringify(message)
    
    header = "--KOP:" + (message.length) + ":POK--";
    
    ws.send(header+message);

}

/**
 *Receive with header
 */
function wget(data){
    
    // Find the KOP (head) of a message
    if(data.search("--KOP:") > -1){
        
        // If it has one, see if the previous message was received correctly
        // If not, print out a warning
        if(volledig == -1) debugEcho("Previous message was not received properly");
        
        // Splice the data to get the header length
        // (Encased like this: "--KOP:733:POK--")
        temp = data.split("--KOP:")
        temp = temp[1].split(":POK--")
        headerlength = temp[0];
        data = temp[1];
        
        // If the length of the data is equal to the length of the header
        // Everything is alright!
        if(data.length == headerlength){
            volledig = 0;
            headerlength = 0;
        } else {
            // If not, store the data in the global "vdata" variable and
            // set "volledig" to -1
            volledig = -1;
            vdata = data;
        }
    } else { // If there is no "KOP" in the data, it's the second part of something
        debugEcho('Second part of message');
        vdata = vdata + data;
        if(vdata.length == headerlength){
            volledig = 0;
            headerlength = 0;
            data = vdata;
        } else {
            volledig = -2;
        }
    }
    
    // If the message is complete, return the entire message
    if(volledig == 0) {
        return data;
    } else {
        return false;
    }
}