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

                                result.push({'x': mx, 'y': my});

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
            if(isTileWalkable(userPosition.map, thisTile[subTile]['x'],thisTile[subTile]['y'])){

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