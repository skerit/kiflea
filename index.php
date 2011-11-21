<head>
	<title>Kiflea Engine</title>
	
	<style type="text/css">
		.title, h1, h2, h3 {font-family: sans-serif;}
		.ms {color: #EE0000;font-family: monospace;}
		.msi {color: #00BB00;font-family: monospace;}
		#main {text-align: center;float:left;font-size: 20px;margin-bottom:10px;width:600px;}
		#echo p, #info p {margin:0px;}
		#flatearth {border: 1px solid #000;}
		#echo, #info {font-family: sans-serif;word-wrap: break-word;}
		#echo {font-size: 12px;}
		#dummyinput {border-style: none;background-color: #000;color: #fff;}
		#cleartable {border-collapse: collapse;text-align: left;}
		.cc {font-size:small;}
		ul.cc {padding-left: 15px;margin:0;}
		p.cc {padding-top: 5px;}
		#footer {
			width:99%;
			height:35px;   /* Height of the footer */
			font-family: sans-serif;
			background: rgba(100,100,100,0.5);
			clear:both;
		     }
		img {border: none;}
		#container {height: 95%};
	</style>
	<!--[if IE]><script type="text/javascript" src="excanvas.compiled.js"></script><![endif]-->
    <!--<script type="text/javascript" src="objSort.js"></script>-->
    <script type="text/javascript">
    /* <![CDATA[ */
        (function() {
            var s = document.createElement('script'), t = document.getElementsByTagName('script')[0];
            s.type = 'text/javascript';
            s.async = true;
            s.src = 'http://api.flattr.com/js/0.6/load.js?mode=auto';
            t.parentNode.insertBefore(s, t);
        })();
    /* ]]> */
    </script>
	<script type="text/javascript" src="kiflea.shim.js"></script>
	<script type="text/javascript" src="json.js"></script>
	<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>
	
	<script type="text/javascript" src="kiflea.unpacking.js"></script>
    <script type="text/javascript" src="kiflea.misc.js"></script>
	<script type="text/javascript" src="kiflea.js"></script>
	<script type="text/javascript" src="kiflea.canvas.js"></script>
	<script type="text/javascript" src="kiflea.rendering.js"></script>
	<script type="text/javascript" src="kiflea.sercon.js"></script>
	<script type="text/javascript" src="kiflea.hud.js"></script>
    <script type="text/javascript" src="kiflea.keyboard.js"></script>
	<script type="text/javascript" src="kiflea.pathfinding.js"></script>
	<script type="text/javascript">
		$(document).ready(function() {
			k.settings.server.CONNECT = false;
			k.settings.server.ADDRESS = 'ws://kipdola.be';
			<?php
			if($_GET['server'] == 'localhost'){
				echo 'k.settings.server.ADDRESS = "ws://localhost";' . "\n";
			}
			?>
			k.settings.server.PORT = 1234;
			k.settings.engine.BASEURL = 'http://kipdola.be/subdomain/kiflea/';
			k.settings.debug.DEBUG = true;
			k.settings.engine.DEFAULTSPRITES = 'default.tmx.xml';
			k.settings.engine.MAPS = ['grassland.tmx.xml', k.settings.engine.DEFAULTSPRITES];
			
			defaultTileWidth = 32;
			defaultTileHeight = 32;
			defaultTilesPerRow = 30;

			userMoveTilePerSecond = 10;
			userMoveMsPerTile = 200;
			userMoveSmoothness = 5;
			drawExtras = 5;
			debugGrid = false;
			debugHudOn = false;
			debugMovement = false;
                        debugPathOn = false;
			backgroundColor = "rgb(255,255,255)";

			animatedObjects = {	// Test data for objects
				"U00002":{
					"uid": "U00002",
					"x": 35,
					"y": 35,
					"moveToX": 35,
					"moveToY": 35,
					"fromX": 35,
					"fromY": 35,
					"msMoved": 100,
					"lastMoved": 1000,
					"map": "grassland.tmx.xml",
					"sprites": [1, 21],
					"spritesToDraw": [1,21], 
					"currentSprite": 1,
					"effects": [{'sprite': 43, 'currentsprite': 43, 'dx': 29, 'dy': 29, 'sx': 35, 'sy': 35, 'x': 35, 'y': 35, 'msPerTile': 90, 'msMoved': 100, 'started': 1000, 'aftereffect': 107, 'id': 5}],
					"selection": 0,
					"currenthealth": 100,
					"fullhealth": 100,
					"path": [],
					"wander": {"x": 35, "y": 35, "xw": 5, "yw": 5, "basePause": 5000},
					"actionsreceived": [{"action": "wander", "active": 1}],
					"finishedEvents": {},
					"position": {'x': 35, 'y': 35}
				},
				"U00003":{
					"uid": "U00003",
					"x": 25,
					"y": 25,
					"moveToX": 25,
					"moveToY": 25,
					"fromX": 25,
					"fromY": 25,
					"msMoved": 100,
					"lastMoved": 1000,
					"map": "grassland.tmx.xml",
					"sprites": [1, 21],
					"spritesToDraw": [1,21], 
					"currentSprite": 1,
					"effects": [],
					"selection": 0,
					"currenthealth": 78,
					"fullhealth": 100,
					"path": [],
					"wander": {"x": 25, "y": 25, "xw": 15, "yw": 15, "basePause": 9000},
					"actionsreceived": [{"action": "wander", "active": 1}],
					"finishedEvents": {},
					"position": {'x': 25, 'y': 25}
				}
			}
			
			animatedObjects[userPosition.uid] = {
				"uid": userPosition.uid,
				"x": 30,
				"y": 31,
				"moveToX": 30,
				"moveToY": 31,
				"fromX": 30,
				"fromY": 31,
				"msMoved": 100,
				"lastMoved": 1000,
				"map": "grassland.tmx.xml",
				"sprites": [1, 21],
				"spritesToDraw": [1, 21], 
				"currentSprite": 1,
				"effects": [],
				"selection": 0,
				"currenthealth": 55,
				"fullhealth": 100,
                "position": {'x': 35, 'y': 17},
				"path": [{x: 33, y: 17}, {x: 34, y: 17}, {x: 35, y: 17}],
				"actionsreceived": [],
				"finishedEvents": {},
				"position": {"x": 30, "y": 31}
			};

			k.operations.startEngine();
		});
	</script>
	
	<script type="text/javascript">
	
	  var _gaq = _gaq || [];
	  _gaq.push(['_setAccount', 'UA-2504173-3']);
	  _gaq.push(['_setDomainName', 'none']);
	  _gaq.push(['_setAllowLinker', true]);
	  _gaq.push(['_trackPageview']);
	
	  (function() {
	    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
	  })();
	
	</script>
</head>
<body style="height:95%">
	<div id="container">
		<div id="main">
			<img src="images/kiflea-logo-v2-small.png">
			<h2 class="title">Kipdola's Flat Earth Engine</h2>
			<canvas id="flatearth" width="480" height="480"></canvas>
			<br/>
			<button id="clearecho" onclick="k.links.echo = '';">Clear echo div</button>
			<button id="toggleengine" onclick="k.operations.toggleEngine();">Toggle engine</button>
			<button id="togglegrid" onclick="k.settings.debug.GRID=!k.settings.debug.GRID;">Toggle grid</button>
			<button id="togglefps" onclick="k.settings.debug.FPS=!k.settings.debug.FPS;">Toggle FPS</button><br/>
			<button id="detractlife" onclick="animatedObjects[userPosition.uid]['currenthealth']--;">Detract life</button>
			<button id="testjson" onclick="sendTestJson()">Send JSON Test</button><br/>
            <button id="previousFrame" onclick="movie.previousFrame()">previousFrame</button>
            <button id="nextFrame" onclick="movie.nextFrame()">nextFrame</button>
            <button id="next100" onclick="movie.nextFrame(100)">nextFrame 100</button>
            <button id="previous100" onclick="movie.previousFrame(100)">previousFrame 100</button>
            <button id="play" onclick="movie.play(25)">Play 25 fps</button>
			<br/><br/>
			<input id="dummyinput" style="margin-bottom:150px;">
		</div>
		<div id="info">
            <a class="FlattrButton" style="display:none;"
            href="http://www.kipdola.be/en/blog/skerit/126-presenting-kiflea-canvas-game-engine-html5"></a>
			<p style="float:right;font-size:13px;">The Kiflea engine aims to bring fun 2D on-line gaming to your browser.<br/><br/>
			
			I set up a repository for the code, more information through the trac link at the bottom of the page.<br/>
			This is my very first time programming something in javascript, optimalization wasn't always the first thing on my mind.<br/>
			Any tips, bugs, patches, ... are very, very welcome!
			</p><div style="clear:right"></div>
			
			<p class="cc" style=""><br/>Example tiles where downloaded from
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
						<li><a href="http://opengameart.org/content/fireball-spell">Fireball Spell</a> by pfunked
						<li><a href="http://opengameart.org/content/bw-ornamental-cursor-19x19">B&W Ornamental Cursor</a> by qubodup 
						</ul>
					</td></tr>
				</table>
			</p>
			<hr>
		</div>
		<div id="counters">
			Count 1: <span id="count1"></span><br/>
			Count 2: <span id="count2"></span>
		</div>
		<div id="echo"></div>
		<div id="debug"></div>
		<div id="footer">
			<a href="http://kipdola.be/trac/repos/" style="padding: 0pt; border: medium none;">
			<img title="Trac" alt="trac_logo_mini.png" src="http://kipdola.be/trac/repos/chrome/common/trac_logo_mini.png"></a>
			A <a href="http://www.kipdola.be">Kipdola Studios production.</a>
			<div style="float:right;"<button id="removefooter" onclick="$('#footer').hide();">Hide footer</button></div>
		</div>
	</div>


</body>