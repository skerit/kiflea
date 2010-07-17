<head>
	<title>Kiflea Engine</title>
	<style type="text/css">
		.title, h1, h2, h3 {font-family: sans-serif;}
		.ms {color: #EE0000;font-family: monospace;}
		.msi {color: #00BB00;font-family: monospace;}
		#main {text-align: center;float:left;font-size: 20px;margin-bottom:10px;width:600px;}
		#debug {margin:auto;width:482px;font-family: monospace;background-color:#000;color:#fff;text-align:left;font-size:12px;}
		#debug p, #echo p, #info p {margin:0px;}
		#flatearth {border: 1px solid #000;}
		#echo, #info {font-family: sans-serif;word-wrap: break-word;}
		#echo {font-size: 12px;}
		#dummyinput {border-style: none;background-color: #000;color: #fff;}
		#cleartable {border-collapse: collapse;text-align: left;}
		.cc {font-size:small;}
		ul.cc {padding-left: 15px;margin:0;}
		p.cc {padding-top: 5px;}
	</style>
	<!--[if IE]><script type="text/javascript" src="excanvas.compiled.js"></script><![endif]-->
	<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>
	<script type="text/javascript" src="kiflea.rendering.js"></script>
	<script type="text/javascript" src="kiflea.unpacking.js"></script>
	<script type="text/javascript" src="kiflea.keyboard.js"></script>
	<script type="text/javascript" src="kiflea.misc.js"></script>
	<script type="text/javascript" src="kiflea.js"></script>
	<script type="text/javascript">
		$(document).ready(function() {
			fps = 3000;
			defaultTileWidth = 32;
			defaultTileHeight = 32;
			defaultTilesPerRow = 30;
			canvasId = 'flatearth';
			echoId = 'echo';
			debugId = 'debug';
			debugOn = true;
			userMoveTilePerSecond = 10;
			userMoveMsPerTile = 200;
			userMoveSmoothness = 5;
			drawExtras = 5;
			debugGrid = false;
			debugMovement = false;
			backgroundColor = "rgb(255,255,255)";
			defaultSprites = 'default.tmx.xml';
			loadMaps = ['grassland.tmx.xml', defaultSprites]; // Always load defaultSprites
			animatedObjects = {	// Test data for objects
				"U00001": {
					"x": 1,
					"y": 1,
					"moveToX": 10,
					"moveToY": 10,
					"fromX": 10,
					"fromY": 10,
					"msMoved": 100,
					"lastMoved": 1000,
					"map": "grassland.tmx.xml",
					"sprites": [1,21], 
					"currentSprite": 1
				},
				"U00002":{
					"x": 2,
					"y": 2,
					"moveToX": 15,
					"moveToY": 15,
					"fromX": 15,
					"fromY": 15,
					"msMoved": 100,
					"lastMoved": 1000,
					"map": "grassland.tmx.xml",
					"sprites": [1], 
					"currentSprite": 1
				},
				"U00003":{
					"x": 5,
					"y": 5,
					"moveToX": 25,
					"moveToY": 25,
					"fromX": 25,
					"fromY": 25,
					"msMoved": 100,
					"lastMoved": 1000,
					"map": "grassland.tmx.xml",
					"sprites": [1,21], 
					"currentSprite": 1
				}
			}
			startEngine();
		});
	</script>
</head>
<body>
	<div id="main">
		<h2 class="title">Kipdola's Flat Earth Engine</h2>
		<canvas id="flatearth" width="480" height="480"></canvas>
		<div id="debug"><p>debug information</p></div>
		<br/>
		<button id="clearecho" onclick="echoOutput.empty();">Clear echo div</button>
		<button id="toggleengine" onclick="toggleEngine();">Toggle engine</button>
		<button id="togglegrid" onclick="debugGrid=!debugGrid;">Toggle grid</button>
		<input id="dummyinput">
	</div>
	<div id="info">
		<p>The Kiflea engine aims to bring fun 2D on-line gaming to your browser.</p>
		<p class="cc">Example tiles where downloaded from
			<a href="http://www.opengameart.org">OpenGameArt.org</a>. I included:
			<table class="cleartable">
				<tr><td>
					<ul class="cc"><li><a href="http://opengameart.org/content/whispers-of-avalon-grassland-tileset">Whispers of Avalon: Grassland Tileset</a> by Leonard Pabin
					<li><a href="http://opengameart.org/content/fire-spell-explosion">Fire Spell Explosion</a> by pfunked
					<li><a href="http://opengameart.org/content/fantasy-rpg-npcs">Fantasy RPG NPCs</a> by Mandi Paugh
					</ul>
				</td>
				<td>
					<ul class="cc"><li><a href="http://opengameart.org/content/anime-style-male-base-sprite">Anime-style male base sprite</a> by Tayoko
					<li><a href="http://opengameart.org/content/pixel-art-contest-entry-brigand-armor">Pixel Art Contest entry: Brigand Armor</a> by Blarumyrran
					</ul>
				</td></tr>
			</table>
		</p>
		<hr>
	</div>
	<div id="echo"></div>
</body>