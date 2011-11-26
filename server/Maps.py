#!/usr/bin/env python
import xml.etree.ElementTree as ET
import math
import base64
from PIL import Image
from toolbox import debug, verbose

class Map:
    name = None
    width = 0
    height = 0
    tileWidth = 0
    tileHeight = 0
    events = {}
    properties = {}
    layers = {}
    tilesets = {}
    tileProperties = {} # Properties for tiles in a tileset are stored here
    mapProperties = {}  # Properties for tiles in a map are stored here, fetched from tileProperties
    walkableTiles = {}  # Deprecated
    eventTiles = {}     # Deprecated
    dir = None
    
    def __init__(self, filename, dir):
        self.name = filename    # The filename equals the mapname
        self.dir = dir          # Where we can find the file
        
        mapTree = ET.parse(dir + filename)  # Open and parse the XML file
        mapRoot = mapTree.getroot()         # Get the root element (<map>, in this case)

        # Get the attributes of the <map> element
        self.width = int(mapRoot.attrib['width'])
        self.height = int(mapRoot.attrib['height'])
        self.tileWidth = int(mapRoot.attrib['tilewidth'])
        self.tileHeight = int(mapRoot.attrib['tileheight'])
        
        # Find all <property> elements within <properties> of the root
        mapProperties = mapRoot.findall('properties/property')
        
        # For every property, store it
        for property in mapProperties:
            self.properties[property.attrib['name']] = property.attrib['value']
            
        # Find all the events, which are called objects in the XML
        mapEvents = mapRoot.findall('objectgroup/object')
        
        for event in mapEvents:
            beginX = int(math.floor(int(event.attrib['x']) / self.tileWidth))
            beginY = int(math.floor(int(event.attrib['y']) / self.tileHeight))
            endX = beginX + int(math.floor(int(event.attrib['width']) / self.tileWidth))
            endY = beginY + int(math.floor(int(event.attrib['height']) / self.tileHeight))
            
            eventProperties = {}
            
            if 'name' in event.attrib:
                eventName = event.attrib['name']
            else:
                eventName = 'unknown'
            
            try:
                eventAction = event.attrib['type']
                
                eventProperties['name'] = eventName
                eventProperties['action'] = eventAction
                
                for props in event.findall('properties/property'):
                    eventProperties[props.attrib['name']] = props.attrib['value']
            except KeyError:
                print "KeyError!"
                continue
            
            print "Storing events in tiles"
            
            countY = beginY
            while countY < endY:
                countX = beginX
                while countX < endX:
                    currentTile = ((countY + 1) * self.width) + countX + 1
                    
                    if currentTile not in self.events:
                        self.events[currentTile] = []
                    
                    # Store the event in the array of this tile
                    self.events[currentTile].append(eventProperties)
                    
                    countX += 1
                countY += 1

        # Find all the layers
        mapLayers = mapRoot.findall('layer')
        
        # Loop through every layer
        for layer in mapLayers:
            properties = {}     # We'll store all the layer properties in here
            layerData = []      # Bitwise decoded decodeData will be stored here
            i = 0               # Iterator counter used for bitwise decoding
            
            # Decode the text of the first <data> element and create an array out of it
            decodeData = [ord(c) for c in layer.find('data').text.decode('base64')]
            
            while i < len(decodeData):
                tempTile = decodeData[i] | decodeData[i + 1] << 8 | decodeData[i + 2] << 16 | decodeData[i + 3] << 24
                
                layerData.append(tempTile)      # Append it to the layerData array
                i += 4                          # Increase the iterator by four
                
            tempProps = layer.find('properties')
            
            if tempProps != None:
            
                tempProps = tempProps.findall('property')    
            
                for property in tempProps:
                    # Best to use the .get() than the .attrib[] one
                    properties[property.get('name')] = property.get('value')
                
                self.layers[layer.get('name')] = {
                    'data': layerData,
                    'name': layer.get('name'),
                    'width': layer.get('width'),
                    'height': layer.get('height'),
                    'opacity': layer.get('opacity'),
                    'properties': properties
                }
        
        # Find all the tilesets
        mapTilesets = mapRoot.findall('tileset')
        
        for tileset in mapTilesets:
            tileSetName = tileset.get('name')
            firstGid = int(tileset.get('firstgid'))
            tileWidth = int(tileset.get('tilewidth'))
            tileHeight = int(tileset.get('tileheight'))
            tileSource = tileset.find('image').get('source')
            
            verbose("Opening image for tileSetName '" + tileSetName + "'", 3, 4)

            # Open the image, calculate its width and such
            im = Image.open(self.dir + tileSource)
            
            tilesPerRow = math.floor(im.size[0] / tileWidth)
            tilesPerCol = math.floor(im.size[1] / tileHeight)
            totalTiles = int(tilesPerCol * tilesPerRow)
            
            self.tilesets[tileSetName] = {
                'name': tileSetName,
                'source': tileSource,
                'tileWidth': tileWidth,
                'tileHeight': tileHeight,
                'firstgid': firstGid,
                'total': totalTiles,
                'tpr': tilesPerRow,
                'tpc': tilesPerCol
            }
            
            verbose("Start looking for tileProperties", 3, 4)

            # Add the new tileSet to the tileProperties list
            self.tileProperties[tileSetName] = {}
            
            # Loop through every tile
            for tile in tileset.findall('tile'):
                
                # Create a temporary list for properties
                tempProperties = {}
                
                # calculate the ID of this tile
                tileGid = firstGid + int(tile.get('id'))
                
                for position, prop in enumerate(tile.findall('properties/property')):
                    
                    propertyName = prop.get('name')
                    propertyValue = prop.get('value')
                    
                    # We define nextframes in tiled according to their order in 
                    # THAT tileset. We don't use tilegids there because these 
                    # can change as new tilesets are added or removed.
                    if propertyName == 'nextframe':
                        tempProperties[propertyName] = int(propertyValue) + (firstGid - 1)
                    else:
                        tempProperties[propertyName] = propertyValue
            
                # Store all the properties of this tile in the tileProperties array
                self.tileProperties[tileSetName][tileGid] = tempProperties
        
        # Get all the walkable tiles
        # Calculate the total ammount of tiles
        totalTileAmmount = self.width * self.height
        
        # Loop through the layers
        for layer in self.layers:
            # Loop through every tile in this layer
            for position, tile in enumerate(self.layers[layer]['data']):
                
                # If the tilenumber is actually in the tileProperties
                if tile in self.tileProperties[self.getTileSetName(tile)]:
                    
                    # Store every property in the mapProperties list
                    # Make sure the position is defined in the list first
                    if position not in self.mapProperties:
                        self.mapProperties[position] = {}
                    
                    for property in self.tileProperties[self.getTileSetName(tile)][tile]:
                        
                        self.mapProperties[position][property] = self.tileProperties[self.getTileSetName(tile)][tile][property]
                    
                    # These 2 are deprecated!
                    # check if it has the "impenetrable" property
                    if 'impenetrable' in self.tileProperties[self.getTileSetName(tile)][tile]:
                        self.walkableTiles[position] = 0;
                    
                    if 'terrainSpeed' in self.tileProperties[self.getTileSetName(tile)][tile]:
                        if position not in self.eventTiles:
                            self.eventTiles[position] = {}
                        
                        self.eventTiles[position]['terrainSpeed'] = self.tileProperties[self.getTileSetName(tile)][tile]['terrainSpeed']
    
    # How fast is this tile?
    def getTerrainSpeed(self, x, y):
        
        # Get the terrain speed of a certain map tile
        speed = self.getMapProperty(x, y, 'terrainSpeed')
        
        # If speed isn't false, return the float of speed
        if speed:
            return float(speed)
        else:
            return 1.0
    
    # Get a property from a map tile
    def getMapProperty(self, x, y, propertyName):
        
        # If x or y is beyond the bounds of the map, return false
        if y < 0 or y > self.height or x < 0 or x >= self.width:
            return False
        
        wantedTile = (y * self.width) + x
        
        # If he wantedTile is defined in the tileProperties list, we can continue.
        if wantedTile in self.mapProperties:
            # If the wanted property exists, return it.
            if propertyName in self.mapProperties[wantedTile]:
                return self.mapProperties[wantedTile][propertyName]
            else:
                return None
            
    # Get the info of a tileset knowing only its tile GID in this map
    def getTileSetName(self, tileNumber):
        for tileset in self.tilesets:
            
            # Save the starting tile
            tileStart = self.tilesets[tileset]['firstgid'] - 1
            
            # Calculate until what tile we can find in here
            tileLimit = self.tilesets[tileset]['total'] + tileStart
            
            # if the tile is bigger than start, but smaller than limit, we found the tileset
            if tileNumber >= tileStart and tileNumber <= tileLimit:
                return tileset
    
    # Is a tile walkable?
    def isTileWalkable(self, x, y):
        impenetrable = self.getMapProperty(x, y, 'impenetrable')
        
        if impenetrable != None:
            impenetrable = int(impenetrable)
        
        if impenetrable == 1:
            return False
        else:
            return True
    
    def printName(self):
        return "Is walkable? " + str(self.isTileWalkable(20,10))
