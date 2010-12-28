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
 *Find the walkable path between 2 points
 *@param    sx  {integer}   Beginning X
 *@param    sy  {integer}   Beginning Y
 *@param    dx  {integer}   Destination X
 *@param    dy  {integer}   Destination Y
 */
function findPath(sx, sy, dx, dy){

    // Start the counter, calculate how long it took
    var timer = now();
    
    // Floor the source coördinates
    sx = Math.floor(sx);
    sy = Math.floor(sy);
    
    dx = Math.floor(dx);
    dy = Math.floor(dy);

    debugPath('We\'re going to look for <b>(' +dx + ',' + dy + ')</b> strting from <b>(' + sx + ',' + sy + ')</b>');
    
    // Start the queue out with our end coordinates
    var queue = [{
        'x': dx,
        'y': dy,
        'step': 0
    }]

    // Save tiles that we have scanned (and are a possible candidate) in here
    var done = [];

    // Save alread queues tiles here (needs a fix, but it's a tmeporary workaround'
    var inq = [];

    // Save the result in here
    var result = [];

    // Debugging counter
    var counter = 0;

    // Do this until the queue is empty
    while(queue.length > 0){

        // We're keeping a counter just in case. Once it hits an insane ammount
        // it stops the pathfinding
        counter++;
        
        // Get the current queued tile
        var qx = queue[0]['x'];
        var qy = queue[0]['y'];
        var qstep = queue[0]['step'];

        // If this is our destination, break the loop
        if(qx == sx && qy == sy) {
            var resultTime = now() - timer;
            debugPath('We have found a path between the destination and source in <b>' + resultTime + '</b>ms');
            timer = now(); // Reset the timer

            // Now that we've found a path we need to return it in order.
            // This means getting all the junk out of the done array.
            // This works in much the same way as finding the path

            // Store the moving variables in here
            var mx = sx;
            var my = sy;

            // Do this until we've traced back to the beginning
            while(qstep > 0){

                // Get the neighbouring tiles of the current source tile
                var thisTile = getNeighbour(mx, my);

                //Loop through the 4 adjacent tiles
                for(var subTile in thisTile){

                    // If the tile is in the done array and its step counter
                    // is smaller, then that path should be taken!

                    // First check if the X arrat exists in there, otherwise we'll get an error
                    if(done[thisTile[subTile]['x']] !== undefined){

                        // Now check if there's a y in there
                        if(done[thisTile[subTile]['x']][thisTile[subTile]['y']] !== undefined){

                            // And NOW check if the step is smaller
                            if(done[thisTile[subTile]['x']][thisTile[subTile]['y']] < (qstep)){
 
                                mx =  thisTile[subTile]['x'];
                                my =  thisTile[subTile]['y'];

                                result.push({'added': now(), 'x': mx, 'y': my});

                                // This step is done, on to the next
                                qstep--;
                                continue;

                            }
                        }
                    }


                }

            }

            resultTime = now() - timer;
            debugPath('And this is the result in <b>' + resultTime + '</b>ms:');

            return result; // Return the result array

        }

        // Add it to the "done" array bi-dimensional
        if(done[qx] === undefined) done[qx] = []; // Make sure the destination exists
        done[qx][qy]=qstep; //Save it
        
        // Get the neighbouring tiles of the current queued tile
        var thisTile = getNeighbour(qx, qy);

        //Loop through the 4 adjacent tiles
        for(var subTile in thisTile){

            // If it's walkable ...
            if(isTileWalkable(animatedObjects[userPosition.uid]['map'], thisTile[subTile]['x'],thisTile[subTile]['y'])){
		

                // Make sure the x already exists in the done array before adding the Y
                if(done[thisTile[subTile]['x']] === undefined){
                    done[thisTile[subTile]['x']] = [];
                }

                // Same for the check array
                if(inq[thisTile[subTile]['x']] === undefined){
                    inq[thisTile[subTile]['x']] = [];
                }

                // If it is NOT in the done array or the inq array, add it to the queue
                if(done[thisTile[subTile]['x']][thisTile[subTile]['y']] === undefined &&
                   inq[thisTile[subTile]['x']][thisTile[subTile]['y']] === undefined ){


                    // Adding to the queue (with an upped qstep) and added to the inq array
                    queue.push({'x': thisTile[subTile]['x'], 'y': thisTile[subTile]['y'], 'step': qstep+1})
                    inq[thisTile[subTile]['x']][thisTile[subTile]['y']]=qstep; //And the inq array

                }else { // It was already in the done array, and therefore is already part of a path

                }
            }
        }

        // Now that we're done we can remove this from the queue
        queue.splice(0,1);

        // If we're just taking too long, return false
        if(counter > 1000000) return false;
        
    }

}

/**
 *Get the coördinates of the adjacant tiles, wheter they exist or not.
 *@param    x   {integer}
 *@param    y   {integer}
 */
function getNeighbour(x,y){

    // Simply calculate these items
    this.up = {'x': x, 'y': y-1}   
    this.down = {'x': x, 'y': y+1}
    this.right = {'x': x+1, 'y': y}
    this.left = {'x': x-1, 'y': y}

    // And return them too
    return({
        'up': this.up,
        'down': this.down,
        'left': this.left,
        'right': this.right
    });
    
}

/**
 *Do actions every object has received
 */
function doActionsReceived(){
    
    for (var objectId in animatedObjects){
        
        for(var actionNr = 0; actionNr < animatedObjects[objectId]['actionsreceived'].length; actionNr++){
	    
	    var thisAction = animatedObjects[objectId]['actionsreceived'][actionNr];
	    var spliced = 0; // Keep a track of all the spliced arrays
	    
	    // Check if this action depends on something
	    if(thisAction['dependon'] !== undefined) {
		
		// Pass all the depending-parameters to the dependCondition function. That'll tell us to continue to the next event or not.
		if(dependCondition(thisAction['dependon'], thisAction['field'], 0, 0, thisAction['parameter'], thisAction['condition'], thisAction['conditionoperator']) == false){
		    animatedObjects[objectId]['actionsreceived'].splice(actionNr-spliced,1);
		    spliced++;
		    continue;
		}
		
	    }
	    
	    switch (thisAction['action']){
		
		case "teleport":
		    
		    // If this object has turned of teleport in its wander, then skip it.
		    if(animatedObjects[objectId]['wander'] !== undefined){
			debugEcho('This is a wandering object!');
		    } else {
			// Do the teleport!
			teleport(objectId, thisAction['x'], thisAction['y'], thisAction['map'])
			
			// Add it to the finished events array
			addFinishedEvent(objectId, thisAction['name']);
			
		    };
		    animatedObjects[objectId]['actionsreceived'].splice(actionNr-spliced,1);
		    break;
		
		case "text":
		    queueText(thisAction['message']);
		    // Add it to the finished events array
		    addFinishedEvent(objectId, thisAction['name']);
		    animatedObjects[objectId]['actionsreceived'].splice(actionNr-spliced,1);
		    spliced++;
		    break;
		
		case "wander":

		    if(animatedObjects[objectId]['path'].length == 0 && (now()-animatedObjects[objectId]['lastMoved']) > (animatedObjects[objectId]['wander']['basePause'] * randBetween(2,5))){
			var curX = animatedObjects[objectId]['x'];
		        var curY = animatedObjects[objectId]['y'];
			var beginX = animatedObjects[objectId]['wander']['x'];
			var beginY = animatedObjects[objectId]['wander']['y'];
		        var maxX = beginX + animatedObjects[objectId]['wander']['xw'];
		        var maxY = beginY + animatedObjects[objectId]['wander']['yw'];
			
			// Add it to the finished events array
			addFinishedEvent(objectId, thisAction['name']);
			
			// Determine if there is a path between our current position and a random other position
		        var path = findPath(curX, curY, randBetween(beginX, maxX), randBetween(beginY, maxY));
			
			// Beware! Sometimes no path can be found. Do not save it to the path if it's undefined
			if(path !== undefined) animatedObjects[objectId]['path'] = deepCopy(path);
		    };
		    break;
		
		case "attack":
		    // Turn on the attackmode
		    queueAction("attackmode", objectId, 1, thisAction['from']);
		    if(animatedObjects[objectId]['currenthealth'] > 0){
			animatedObjects[objectId]['currenthealth'] -= thisAction['value'];
			animatedObjects[objectId]['effects'].push({'sprite': 1, 'currentsprite': 1, 'sx': animatedObjects[thisAction['from']]['x'], 'sy': animatedObjects[thisAction['from']]['y'], 'dx': animatedObjects[objectId]['x'], 'dy': animatedObjects[objectId]['y'], 'x': animatedObjects[thisAction['from']]['x'], 'y': animatedObjects[thisAction['from']]['y'], 'msPerTile': 90, 'msMoved': 100, 'started': now(), 'id': rand(100)});
		    }
		    addFinishedEvent(objectId, thisAction['name']);
		    animatedObjects[objectId]['actionsreceived'].splice(actionNr-spliced,1);
		    spliced++;
		    break;
		
		case "attackmode": // Attack something
		    // Remove the attackmode if the own user received it or if the target is dead
		    debugArray(thisAction);
		    if(objectId == userPosition.uid || animatedObjects[thisAction['target']]['currenthealth'] == 0) {
			animatedObjects[objectId]['actionsreceived'].splice(actionNr-spliced,1);
			spliced++;
		    } else {
			queueAction("attack", thisAction['from'], 1, objectId);
		    }
		    

	    }
	}
    }
    
}

/**
 *Add a finished event to the object's array
 */
function addFinishedEvent(objectId, eventname){
    
    // Add it to the finished events if it doesn't exist there yet
    if(animatedObjects[objectId]['finishedEvents'][eventname] === undefined){
	animatedObjects[objectId]['finishedEvents'][eventname] = 1;
    } else { // Else up the counter
	animatedObjects[objectId]['finishedEvents'][eventname]++;
    }
    
}

/**
 *Add a path, meant for keyboard
 *@param 	x	{integer}	Move X? (Should be 1, -1 or 0)
 *@param	y	{integer}	Move Y? (Should be 1, -1 or 0)
 *@param	objectid {string}	The id of the object to move
 *@param	checkfull {boolean}	Enabled by default, only add paths if the array isn't full?
 */
function addPath(x, y, objectid, checkfull){
    
    
    // If there isn't an objectid, use our own user
    if(objectid === undefined) {
	objectid = userPosition.uid;
    }
      
    var arraySize = animatedObjects[objectid]['path'].length;

    //debugArray(animatedObjects[objectid]);
    // Checkfull makes us check if the array is full. If it's not, add the path.
    // This variable is enabled by default.
    if(checkfull === undefined || checkfull == true) {
	if(arraySize > 0) return;
    }
    
    // If the size of the walkable paths is bigger than zero, we take our previous x and y values from here
    if (arraySize > 0) {
	var prevX = animatedObjects[objectid]['path'][arraySize-1]['x'];
	var prevY = animatedObjects[objectid]['path'][arraySize-1]['y'];
    } else { // Else we take it from the objects current X and Y values
	var prevX = animatedObjects[objectid]['fromX'];
	var prevY = animatedObjects[objectid]['fromY'];
    }
    
    // Add the new path directly if we're not connected to a server
    if(connectToServer == false){
	animatedObjects[objectid]['path'].push({'added': now(), 'x': prevX + x, 'y': prevY + y});
    } else {
	wsend({'action': 'move', 'added': now(), 'x': prevX + x, 'y': prevY + y});
    }
    
    return false;
    
}

/**
 *Teleport an object to a specific location
 *@param    objectid    {string}    The object to transport
 *@param    x           {integer}   The x-tile to move it to
 *@param    y           {integer}   The y-tile to move it to
 *@param    map         {string}    The map to move it to
 */
function teleport(objectid, x, y, map){
    
    // Create a symlink to this object
    var object = animatedObjects[objectid];
    
    // If the object exists...
    if(object !== undefined) {
        
	// Prepare the move
        object['path'] = [];
        object['x'] = parseInt(x);
        object['y'] = parseInt(y);
        object['moveToX'] = parseInt(x);
        object['moveToY'] = parseInt(y);
        object['fromX'] = parseInt(x);
        object['fromY'] = parseInt(y);
	
	object['lastMoved'] = now();
        
	// Change the map if we've given one
        if(map !== undefined){
            object['map'] = map;
        }
        
    }
}

/**
 * If an object has a certain path it needs to walk, make sure that path gets
 * executed properly.
 * @param   objectId    {string}    The ID of the object
 */
function walkPath(objectId){
    
    // Does this object have a path? Otherwise we can end this function already
    if(animatedObjects[objectId]['path'].length == 0) return;
    
    // Now store the first step in the path
    var step = animatedObjects[objectId]['path'][0];

    // Adjust the object's x position if the current position does not equal its destination.
    if(animatedObjects[objectId]['x'] != step['x']){
        
	// Has the lastMoved been set?
	if(step['lastMoved'] === undefined) {
	    step['lastMoved'] = now();
	    animatedObjects[objectId]['lastMoved'] = now();
            
            // Get the event for this tile in the map and add it to the action list
            getMapEvent(objectId, step['x'], step['y']);
	}
	
        // How much time has past since we started this move?
        animatedObjects[objectId]['msMoved'] = now() - animatedObjects[objectId]['lastMoved'];
        step['msMoved'] = now() - animatedObjects[objectId]['lastMoved'];
        
        // Calculate how many tiles we have to move
        var moveAmmount = (step['x'] - animatedObjects[objectId]['fromX']);

        // Detect the direction of the move (left or right and numerical)
        if(moveAmmount>0){
            // Move to the right
            var movementDirection = 'righttile';
            var directionAmmount = +1;
        } else {
            var movementDirection = 'lefttile';
            var directionAmmount = -1;
        }

        // What is the next tile in this direction?
        var nextTile = Math.floor(animatedObjects[objectId]['x'])+directionAmmount;
        
        // If the next tile is past our destination, we don't need to take it into account
        if((nextTile*directionAmmount) > (step['x'] * directionAmmount)) nextTile -= directionAmmount;
        
        // Change the direction of the tile with our function
        // This has to happen wheter the tile is walkable or not
        changeMovingObjectSprite(objectId, movementDirection);
	
        // If the next tile we're going to enter (floor of current tile +1 or -1)
        // is not walkable, then empty the array
        if(isTileWalkable(animatedObjects[userPosition.uid]['map'], nextTile, step['y']) == false){
            
            animatedObjects[objectId]['path'].splice(0,animatedObjects[objectId]['path'].length);
            
        } else { // If it is walkable, actually move
            // Our progress in this move (between 0 and 1)
            var objectMoveProgress = step['msMoved']/(userMoveMsPerTile*Math.abs(moveAmmount));
            
            animatedObjects[objectId]['moveToX'] = step['x'];
            
            debugMove('Object <b>' + objectId + '</b> has to move <b>' + moveAmmount + ' tiles, moving progress (X): ' + objectMoveProgress, false);
            
            // If we've spent too much time on this move: finish it
            if(step['msMoved'] >= (userMoveMsPerTile*Math.abs(moveAmmount))){
                animatedObjects[objectId]['x'] = step['x'];
                animatedObjects[objectId]['fromX'] = animatedObjects[objectId]['x'];
                
                // And remove this from the array
                animatedObjects[objectId]['path'].splice(0,1);
                
            } else { // Else calculate our current position
                
                debugMove('<b>From ' + animatedObjects[objectId]['fromX'] + ' to ' + step['x']);
                debugMove('Moving X: ' + animatedObjects[objectId]['x'] + ' to ... ');
                
                animatedObjects[objectId]['x'] = animatedObjects[objectId]['fromX'] + ((step['x'] - animatedObjects[objectId]['fromX'])*objectMoveProgress);
            }
            
            debugMove('Object ' + objectId + '\'s new X: ' + animatedObjects[objectId]['x']);
        }
        
    }
    
    // Adjust the user's y position if the current position
    // does not equal our destination.
    if(animatedObjects[objectId]['y'] != step['y']){    
        
	// Has the lastMoved been set?
        // If it hasn't, we also have to check for an event here
	if(step['lastMoved'] === undefined) {
	    step['lastMoved'] = now();
	    animatedObjects[objectId]['lastMoved'] = now();
            
            // Get the event for this tile in the map and add it to the action list
            getMapEvent(objectId, step['x'], step['y']);
            
	}
	
        // How much time has past since we started this move?
        animatedObjects[objectId]['msMoved'] = now() - animatedObjects[objectId]['lastMoved'];
        step['msMoved'] = now() - animatedObjects[objectId]['lastMoved'];
        
        // Calculate how many tiles we have to move
        var moveAmmount = (step['y'] - animatedObjects[objectId]['fromY']);

        // Detect the direction of the move (left or right and numerical)
        if(moveAmmount>0){
            // Move down
            var movementDirection = 'downtile';
            var directionAmmount = +1;
        } else {
            var movementDirection = 'uptile';
            var directionAmmount = -1;
        }

        // What is the next tile in this direction?
        var nextTile = Math.floor(animatedObjects[objectId]['y'])+directionAmmount;
        
        // If the next tile is past our destination, we don't need to take it into account
        if((nextTile*directionAmmount) > (step['y'] * directionAmmount)) nextTile -= directionAmmount;
        
        // Change the direction of the tile with our function
        // This has to happen wheter the tile is walkable or not
        changeMovingObjectSprite(objectId, movementDirection);

        // If the next tile we're going to enter (floor of current tile +1 or -1)
        // is not walkable, then empty the array
        if(isTileWalkable(animatedObjects[userPosition.uid]['map'], step['x'], nextTile) == false){
            
            animatedObjects[objectId]['path'].splice(0,animatedObjects[objectId]['path'].length);
            
        } else { // If it is walkable, actually move
            // Our progress in this move (between 0 and 1)
            var objectMoveProgress = step['msMoved']/(userMoveMsPerTile*Math.abs(moveAmmount));
            
            animatedObjects[objectId]['moveToY'] = step['y'];
            
            debugMove('Object <b>' + objectId + '</b> has to move <b>' + moveAmmount + ' tiles, moving progress (Y): ' + objectMoveProgress, false);
            
            // If we've spent too much time on this move: finish it
            if(step['msMoved'] >= (userMoveMsPerTile*Math.abs(moveAmmount))){
                animatedObjects[objectId]['y'] = step['y'];
                animatedObjects[objectId]['fromY'] = animatedObjects[objectId]['y'];
                
                // And remove this from the array
                animatedObjects[objectId]['path'].splice(0,1);
                
            } else { // Else calculate our current position
                
                debugMove('<b>From ' + animatedObjects[objectId]['fromY'] + ' to ' + step['y']);
                debugMove('Moving Y: ' + animatedObjects[objectId]['y'] + ' to ... ');
                
                animatedObjects[objectId]['y'] = animatedObjects[objectId]['fromY'] + ((step['y'] - animatedObjects[objectId]['fromY'])*objectMoveProgress);
            }
            
            debugMove('Object ' + objectId + '\'s new Y: ' + animatedObjects[objectId]['y']);
        }
        
    }
    
}