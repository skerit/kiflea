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
 *@param    sx  {int}   Beginning X
 *@param    sy  {int}   Beginning Y
 *@param    dx  {int}   Destination X
 *@param    dy  {int}   Destination Y
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
            if(k.operations.isTileWalkable(animatedObjects[userPosition.uid]['map'], thisTile[subTile]['x'],thisTile[subTile]['y'])){
		

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
 * Request a move
 * @param 	{integer}			x		x-movement (Should be 1, -1 or 0)
 * @param	{integer}			y		y-movement (Should be 1, -1 or 0)
 * @param	{k.Types.Object}	object	The object to move
 */
k.actions.moveRequest = function(x, y, object) {

	// If the object isn't specified, use the current user
	if(object === undefined) object = k.sel;
	
	// Temporary: should be removed as only objects should be passed
	if(typeof object == "string") object = k.links.getObject(object);

	/**
	 * Checkfull makes us check if the array is full. If it's not, add the path.
	 * This variable is enabled by default.
	 */
	if(object.path.length > k.state.walk.maxQueue) return false;
	
	// Get the previous step from our path
	var prev = k.links.step.getPrev(object);
	
	var move = k.links.step.create(prev.position.x + x, prev.position.y + y);

	// If we're not connected to the server, accept the move directly
	if(!k.state.server.connected) {
		
		// Is the tile walkable?
		move.properties.walkable = k.operations.isTileWalkable(object.map.name, move.position.x, move.position.y);
		k.actions.moveAccept(object, move);
		
	} else {
		
		// If we are, send it to the server first
		// We used to send the action as a part of the object itself, but that
		// would cause the object to become dirty. I suggest sending an object
		// containing a payload and an instruction type.
		k.send(move);
	}

	return false;

}

/**
 * Add a move to the object's path
 * @param	{k.Types.Object}	object
 * @param	{k.Types.Pathstep}	move
 */
k.actions.moveAccept = function(object, move){
	
	// Add the move to the queue of this object
	object.path.push(move);
	
	// Set the object as dirty
	k.links.canvas.dirty.set.byObject(object);

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
 * @param       object    {k.Types.Object}    The object
 */
k.operations.walkPath = function(object) {

	// When there are no steps queued exit the function
	if(object.path.length < (k.state.walk.indexNext + 1)) return;

	// Normally we only run walk.step once, but sometimes we need to do it twice for a nice smooth transition
	var keepWalking = false;

	do {
		
		// Store our previous, current and future steps
		var stepPrev = k.links.step.get(object, k.state.walk.indexPrev);
		var stepNow = k.links.step.get(object, k.state.walk.indexNow);
		var stepNext = k.links.step.get(object, k.state.walk.indexNext);
		var stepFut = k.links.step.getNext(object);
		
		var futRequestTime;

		// Calculate the waiting time for the future step, if there is one
		if(stepFut) {
			futRequestTime = (stepFut.time.request - stepNext.time.request)
		}
		else {
			futRequestTime = 9999;
		}

		keepWalking = k.operations.walk.step(object, stepNow, stepNext, futRequestTime, keepWalking);

	} while(keepWalking == true);
}

/**
 * Execute a step in the path
 * @param	{k.Types.Object}	object		The object we're changing
 * @param	{k.Types.Pathstep}	stepNow
 * @param	{k.Types.Pathstep}	stepNext
 * @param	futRequestTime
 * @param	keepWalking
 */
k.operations.walk.step = function(object, stepNow, stepNext, futRequestTime, keepWalking){

	// Our basic return value to determine if we need to walk another step
	var walkAnotherStep = false;
	
	var begin = false;
	var axischange = false;

	// Is this the first time we see this step?
	if(stepNext.time.begin == 0) {

		// Determine along what axis we need to move (x or y)
		stepNext.state.axis = stepNow.position.x != stepNext.position.x ? 'x' : 'y';

		// Mark now() as the beginning of the step
		stepNext.time.begin = now();
		
		begin = true;

		// Get the event for this tile in the map and add it to the action list
		// FIXME: Events!
		//getMapEvent(objectId, stepNext.x, stepNext.y);

		// Calculate the waiting times
		// The wait time between the request and the beginning of the next step
		stepNext.state.wait = stepNext.time.begin - stepNext.time.request;

		// How fast we requested this move after the previous one (Pressing down generates a keypress around every 68ms)
		stepNext.state.requestSpeed = stepNext.time.request - stepNow.time.request;

		// The gap between the current (next) and the previous (now) step.
		stepNext.state.gap = stepNext.time.begin - stepNow.time.end;

		// Get the terrain speed (certain terrains make you move faster)
		stepNext.properties.speed = stepNext.properties.speed === undefined ? 100 : stepNext.properties.speed;

		// Calculate the numerical direction
		stepNext.state.direction = (stepNext.position[stepNext.state.axis] - stepNow.position[stepNext.state.axis]);

		// If the absolute moveDirection is bigger than 1, remove the step and all the following
		if(Math.abs(stepNext.state.direction) > 1) object.path.splice(k.state.walk.indexNext, (object.path.length - k.state.walk.indexNext));

		// Depending on the direction on this axis, choose the right tile
		stepNext.state.sprite = stepNext.state.direction > 0 ? (stepNext.state.axis == 'x') ? 'righttile' : 'downtile' :
															   (stepNext.state.axis == 'x') ? 'lefttile' : 'uptile';

		// What is the next tile in this direction?
		stepNext.state.nextTile = object.position[stepNext.state.axis] + stepNext.state.direction;

		// Change the direction of the tile with our function
		// This has to happen wheter the tile is walkable or not
		changeMovingObjectSprite(object.id, stepNext.state.sprite);

		// If the next tile we're going to enter isn't walkable, remove that and all the following steps, and make sure we're propperly positioned
		// Do the same if the tile is more than 1 tile away
		// || ((Math.abs(Math.abs(stepNext.x) - Math.abs(position.x)) > 1) || (Math.abs(Math.abs(stepNext.y) - Math.abs(position.y)) > 1))
		if(!stepNext.properties.walkable) {

			object.path.splice(k.state.walk.indexNext, (object.path.length - k.state.walk.indexNext));

			object.position.x = stepNow.position.x;
			object.position.y = stepNow.position.y;
			
			object.position.zx = stepNow.position.x;
			object.position.zy = stepNow.position.y;
			
		}
		
	}

	// If the axes of the move is found and the tile is walkable
	if(stepNext.state.axis && stepNext.properties.walkable) {
		
		// In a perfect world this would work fine, but sometimes
		// when going through a queue the normal and z floor values
		// would not line up. I've added a "fix" for that down below,
		// which is more resource intensive and currently renders
		// this code redundant.
		if(!begin){
			if(stepNext.state.direction < 0){
				object.position.x = stepNext.position.x;
				object.position.y = stepNext.position.y;
			}
		}
		
		// How much time has past since the beginning of this step?
		stepNext.state.change = parseInt(now() - stepNext.time.begin);

		// If keepWalking is true this is the second time we run this function this frame
		// This time adition to the moveChange should make walking smoother.
		if(keepWalking) stepNext.state.change += stepNext.state.gap;

		// If the next tile is past our destination, we don't need to take it into account
		// if ((nextTile * directionAmmount) > (step['x'] * directionAmmount)) nextTile -= directionAmmount;

		// If it is walkable, actually move
		// Our progress in this move (between 0 and 1)
		stepNext.state.progress = ((stepNext.state.change * (stepNext.properties.speed/100)) / k.settings.walk.msPerTile);
		
		debugMove('<b>' + object.id + '</b> has to move ' + stepNext.state.direction + ' (' + stepNext.state.axis + '): ' + stepNext.state.progress + ' Now: <b>(' + object.position.x + ', ' + object.position.y + ')</b> - Destination: (' + stepNext.position.x + ', ' + stepNext.position.y + ') ' + futRequestTime, false);

		// If we've spent too much time on this move: finish it
		if((stepNext.state.change * (stepNext.properties.speed/100)) >= k.settings.walk.msPerTile) {

			// Indicate when this move ended
			stepNext.time.end = now();

			// Store the overtime
			stepNext.state.overtime = ((stepNext.state.change)  * (stepNext.properties.speed/100)) - k.settings.walk.msPerTile;

			// If this is the end of the queue, use the requested ending axis position
			// If not, leave it as it is.
			if((object.path.length - 1) <= (k.state.walk.indexNext)) {
				// Store our destination in the position
				object.position[stepNext.state.axis] = stepNext.position[stepNext.state.axis];
				object.position["z" + stepNext.state.axis] = stepNext.position[stepNext.state.axis];
			} else {
				
				if(object.path[k.state.walk.indexNow+1].position[stepNext.state.axis] == stepNext.position[stepNext.state.axis]){
					axischange = true;
				} else {
					axischange = false;
				}

				// If the future step isn't on the same axis, do reset the position
				if(axischange){
					object.position[stepNext.state.axis] = stepNext.position[stepNext.state.axis];
					object.position["z"+stepNext.state.axis] = stepNext.position[stepNext.state.axis];
				}
				
				// Was the next step (the future one) requested in time?
				// Future steps do not have a moveRequestTime property yet
				if(futRequestTime < 300) walkAnotherStep = true;
			}
			
			if(!walkAnotherStep) {
				object.position.zx = stepNext.position.x;
				object.position.zy = stepNext.position.y;
			}
			
			object.position.x = stepNext.position.x;
			object.position.y = stepNext.position.y;

			// Move the queue up by one
			object.path.splice(0, 1);

		} else { // Else calculate our current position

			object.position["z" + stepNext.state.axis] = stepNow.position[stepNext.state.axis]
				+ ((stepNext.position[stepNext.state.axis] - stepNow.position[stepNext.state.axis]) * stepNext.state.progress);
			
			// In a perfect world this would not be necesary, but sometimes when
			// going through a queue, the x and zx (or y and zy) floor values
			// would differ, so we set them again here.
			object.position[stepNext.state.axis] = ~~object.position["z" + stepNext.state.axis];
			
		}
	}
	
	// Flag this object as dirty
	k.links.canvas.dirty.set.byObject(object, 1);
	
	return walkAnotherStep;

}
