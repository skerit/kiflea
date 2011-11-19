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
	Created on: 2011/01/08 20:34
	Last Modified: Trunk
*/

/**
 * A collection of type definitions
 * @type {Object}
 */
k.Types = {};

/**
 * The object we receive on an event move
 * @typedef {Object}
 */
k.Types.EventMoveRequest = {
	
	/**
	 * The timestamp we requested this move
	 * @type	{Number}
	 */
	timeRequested: 0,
	
	/**
	 * The x we want to move to
	 * @type	{Number}
	 */
	x: 0,
	
	/**
	 * The y we want to move to
	 * @type	{Number}
	 */
	y: 0,
	
	/**
	 * The id of the object we're moving
	 * @type	{Number}
	 */
	targetid: 0	
	
}

/**
 * The object when a move has been accepted
 * @typedef {Object}
 */
k.Types.EventMoveAccept = {
	
	/**
	 * The timestamp we requested this move
	 * @type	{Number}
	 */
	timeRequested: 0,
	
	/**
	 * The x we want to move to
	 * @type	{Number}
	 */
	x: 0,
	
	/**
	 * The y we want to move to
	 * @type	{Number}
	 */
	y: 0,
	
	/**
	 * The id of the object we're moving
	 * @type	{Number}
	 */
	targetid: 0,
	
	/**
	 * When coming from a server, the from will be for which user this is
	 * @type	{String}
	 */
	from: "U1",
	
	/**
	 * When we actually started to perform this move
	 * @type	{Number}
	 */
	moveBegin: 0,
	
	/**
	 * Along what axis are we moving?
	 * @type	{String}
	 */
	moveAxis: 'x',
	
	/**
	 * @type	{Number}
	 */
	moveWait: 0,
	
	/**
	 * @type	{Number}
	 */
	moveGap: 0,
	
	/**
	 * How much time has changed since the beginning of this step?
	 * @type	{Number}
	 */
	moveChange: 0,
	
	/**
	 * How far along are we in moving?
	 * @type	{Number}
	 */
	moveProgress: 0,
	
	/**
	 * When did we finish this move?
	 * @type	{Number}
	 */
	moveEnd: 0,
	
	/**
	 * Did we spend too much time on this move? How much?
	 * @type	{Number}
	 */
	moveOvertime: 0,
	
	/**
	 * How "fast" this tile is, how quickly a move over it should be done
	 * @type	{Number}
	 */
	terrainSpeed: 1.0,
	
	/**
	 * In what direction we're moving
	 * @type	{Number}
	 */
	moveDirection: 0,
	
	/**
	 * @type	{}
	 */
	moveSprite: '',
	
	/**
	 * Is it walkable?
	 * @type	{Bool}
	 */
	walkable: 1
	
	
}
