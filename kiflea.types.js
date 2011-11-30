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
	 * The target object
	 * @type	{k.Types.Object}
	 */
	object: {},
	
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

/**
 * The object we get upon a click
 * @typedef {Object}
 */
k.Types.CoordinatesClick = {
	
	/**
	 * The x on the map
	 * @type	{Number}
	 */
	mapX: 0,
	
	/**
	 * The y on the map
	 * @type	{Number}
	 */
	mapY: 0,
	
	/**
	 * The x on the canvas
	 * @type	{Number}
	 */
	canvasX: 0,
	
	/**
	 * The y on the canvas
	 * @type	{Number}
	 */
	canvasY: 0,
	
	/**
	 * The x of the mouse
	 * @type	{Number}
	 */
	mouseX: 0,
	
	/**
	 * The y of the mouse
	 * @type	{Number}
	 */
	mouseY: 0,
	
		/**
	 * The absolute X
	 * @type	{Number}
	 */
	absX: 0,
	
	/**
	 * The absolute Y
	 * @type	{Number}
	 */
	absY: 0,
	
	/**
	 * The lexicographical order on the current map
	 * @type	{Number}
	 */
	lex: 0
	
}

/**
 * A map object
 * @typedef {Object}
 */
k.Types.Map = {
	
	/**
	 * The (source)name of the map
	 * @type	{String}
	 */
	name :'',
	
	/**
	 * The height of the map
	 * @type	{Number}
	 */
	height: 0,
	
	/**
	 * The width of a map
	 * @type	{Number}
	 */
	width: 0,
	
	/**
	 * The tileHeight of a map
	 * @type	{Number}
	 */
	tileHeight: 0,
	
	/**
	 * The tileWidth of a map
	 * @type	{Number}
	 */
	tileWidth: 0,
	
	/**
	 * The width of the map in pixels
	 * @type	{Integer}
	 */
	pixelWidth: 0,
	
	/**
	 * The height of the map in pixels
	 * @type	{Integer}
	 */
	pixelHeight: 0,
	
	/**
	 * Events on a map
	 * @type	{Object}
	 */
	events: {},
	
	/**
	 * Layers on a map
	 * @type	{Object}
	 */
	layers: {},
	
	/**
	 * Properties on a map
	 * @type	{Object}
	 */
	properties: {},
	
	/**
	 * Tilesets on a map
	 * @type	{Object}
	 */
	tilesets: {},
	
	/**
	 * Walkabletiles on a map
	 * @type	{Array}
	 */
	walkableTiles: {},
	
	/**
	 * Shadowtiles in a map
	 * @type	{Array}
	 */
	shadowTiles: {}
}

/**
 * A layer on the map
 * @typedef {Object}
 */
k.Types.mapLayer = {
	
	/**
	 * The array holding all the tiles in a lexicographical order
	 * @type	{Array}
	 */
	data: [],
	
	/**
	 * The height of this layer
	 * @type	{Integer}
	 */
	height: 0,
	
	/**
	 * The width of this layer
	 * @type	{Integer}
	 */
	width: 0,
	
	/**
	 * The name of this map
	 * @type	{String}
	 */
	name: "",
	
	/**
	 * The opacity of this map
	 * @type	{Integer}
	 */
	opacity: 0,
	
	/**
	 * The properties of this layer
	 * @type	{Object}
	 */
	properties: {}
}

/**
 * The tileSetInfo object
 * @typedef {Object}
 */
k.Types.tileSetInfo = {
	
	/**
	 * The name of the tileset
	 * @type {String}
	 */
	name: "",
	
	/**
	 * The tileset image
	 * @type	{Object}
	 */
	image: {},
	
	/**
	 * The width of a single tile
	 * @type {Number}
	 */
	tileWidth: 0,
	
	/**
	 * The height of a single tile
	 * @type {Number}
	 */
	tileHeight: 0,
	
	/**
	 * The tiles per row
	 * @type {Number}
	 */
	tpr: 0,
	
	/**
	 * The tiles per column
	 * @type {Number}
	 */
	tpc: 0,
	
	/**
	 * The total amount of tiles
	 * @type {Number}
	 */
	total: 0,
	
	/**
	 * The id of the first tile
	 * @type {Number}
	 */
	firstgid: 0
}

/**
 * A tile object
 * @typedef	{Object}
 */
k.Types.Tile = {
	
	/**
	 * The parent tileset
	 * @type	{k.Types.tileSetInfo}
	 */
	tileset: {},
	
	/**
	 * The global tilenumber
	 * @type	{Integer}
	 */
	tilegid: 0,
	
	/**
	 * The local tilenumber
	 * @type	{Integer}
	 */
	tilenr: 0,
	
	/**
	 * The properties of this tile
	 * @type	{Object}
	 */
	properties: {},
	
	/**
	 * The coordinates of this tile
	 * @type	{k.Types.CoordinatesClick}
	 */
	coord: {},
	
	/**
	 * If the space where this tile is in is dirty
	 * @type	{Bool}
	 */
	dirty: true
	
}

/**
 * The game object and character object
 * @typedef	{Object}
 */
k.Types.Object = {
	
	/**
	 * The ID of this object
	 * @type	{String}
	 */
	id: "",
	
	/**
	 * The position of our character
	 * @type	{Object}
	 */
	position: {x: 0, y:0, zx: 0.0, zy: 0.0},
	
	/**
	 * The map our object is currently on
	 * @type {k.Types.Map}
	 */
	map: {},
	
	/**
	 * The path our object needs to walk
	 * @type	{Array[k.Types.Pathstep]}
	 */
	path: [],
	
	/**
	 * An array of tile GIDS our object uses
	 * @type	{Array}
	 */
	tiles: [],
	
	/**
	 * Information about the state of this object
	 * @type	{Object}
	 */
	state: {
		
		/**
		 * When we last heard something from this object (if on-line)
		 * @type	{integer}
		 */
		ping: 0,
		
		/**
		 * When this object last moved
		 * @type	{integer}
		 */
		msMoved: 0,
		
		/**
		 * A collection of tiles
		 */
		tiles: [],
		
		/**
		 * Along what axis we're moving
		 */
		axis: ''
		
	}
}

/**
 * A single step in a path
 * @typedef	{Object}
 */
k.Types.Pathstep = {
	
	/**
	 * Object containing timings
	 * @type	{Object}
	 */
	time: {
		
		/**
		 * When it was requested
		 * @type	{Integer}
		 */
		request: 0,
		
		/**
		 * When the move began
		 * @type	{Integer}
		 */
		begin: 0,
		
		/**
		 * When the move ended
		 * @type	{Integer}
		 */
		end: 0
	},
	
	/**
	 * The position of this move
	 * @type	{Object}
	 */
	position: {
		x: 0,
		y:0
	},
	
	/**
	 * Properties of this movement
	 * @type	{Object}
	 */
	properties: {
		
		/**
		 * Is this walkable?
		 * @type	{Boolean}
		 */
		walkable: true,
		
		/**
		 * How fast can we go on this?
		 */
		speed: 100
	},
	
	/**
	 * The state of this step
	 * @type	{Object}
	 */
	state: {
		
		/**
		 * The axis of this movement
		 */
		axis: "",
		
		/**
		 * How long it took to request this move
		 */
		requestSpeed: 0,
		
		/**
		 * How long we had to wait
		 */
		wait: 0,
		
		/**
		 * The time gap between moves
		 */
		gap: 0,
		
		/**
		 * The direction of this move
		 */
		direction: 0,
		
		/**
		 * What sprite type to use for this move
		 */
		sprite: "",
		
		/**
		 * What's the next tile in this direction?
		 */
		nextTile: 0,
		
		/**
		 * How much time has passed since the beginning of this step
		 */
		change: 0,
		
		/**
		 * How much this move has progressed
		 */
		progress: 0,
		
		/**
		 * How much longer did we spend on this move than allowed?
		 */
		overtime: 0
		
	}
}

/**
 * The object object
 * @typedef {Object}
 */
k.Types.oldObject = {
	
	/**
	 * What action we last received
	 * @type	{String}
	 */
	action: "",
	
	actionsreceived: [],
	
	/**
	 * Our current sprite
	 * @type	{Number}
	 */
	currentSprite: 0,
	
	currenthealth: 0,
	effects: [],
	finishedEvents: {},
	from: "",
	fromX: 0,
	fromY: 0,
	fullhealth: 0,
	lastMoved: 0,
	map: "",
	moveToX: 0,
	moveToY: 0,
	msMoved: 0,
	path: [],
	position: {
		
		x: 0,
		
		y: 0
		
		},
	selection: 0,
	sprites: [],
	spritesToDraw: [],
	uid: "",
	x: 0,
	y: 0
}
