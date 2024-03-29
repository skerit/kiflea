<head>
	<title>Kiflea Engine</title>
	
	<style type="text/css">
		.title, h1, h2, h3 {font-family: sans-serif;}
		.ms {color: #EE0000;font-family: monospace;}
		.msi {color: #00BB00;font-family: monospace;}
		#main {text-align: center;float:left;font-size: 20px;margin-bottom:10px;width:600px;height:700px;}
		#echo p, #info p {margin:0px;}
		#flatearth {border: 1px solid #000;}
		#echo, #info {font-family: monospace;word-wrap: break-word;}
		#echo {font-size: 12px;}
		#dummyinput {border-style: none;background-color: #000;color: #fff;}
		#cleartable {border-collapse: collapse;text-align: left;}
		.cc {font-size:small;}
		ul.cc {padding-left: 15px;margin:0;}
		p.cc {padding-top: 5px;}
		.one {display:none;}
		#footer {
			width:99%;
			height:35px;   /* Height of the footer */
			font-family: sans-serif;
			background: rgba(100,100,100,0.5);
			clear:both;
		     }
		img {border: none;}
		#container {height: 95%;}
		#titlogo {height: 81px;margin-bottom: 6px;}
		#titlogo img {float:left;max-width: 150px;}
		#titlogo h2 {margin-top: 0px;padding-top: 20px;}
		#info {margin-left: 600px;height:700px;}
		
		.canvascontainer {
			position: relative;
			margin: auto;
		}
		
		.canvascontainer canvas {
			position: absolute;
			left: 0;
			top: 0;
		}
		
		.debugsettings {
			position:fixed;
			top:10px;
			left:50%;
			width: 650px;
			background: rgba(204,204,255,0.85);
		}
		
		.debugsettings .group {
			float:left;
		}
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
	<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
	
	<script type="text/javascript" src="kiflea.unpacking.js"></script>
    <script type="text/javascript" src="kiflea.js"></script>
	<script type="text/javascript" src="kiflea.misc.js"></script>
	<script type="text/javascript" src="kiflea.load.js"></script>
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
			k.settings.engine.DEFAULTSPRITES = 'default.tmx';
			k.settings.engine.MAPS = ['template.tmx', k.settings.engine.DEFAULTSPRITES];
			
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
					"map": "template.tmx",
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
					"map": "template.tmx",
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
<body>
	<div id="container">
		<div id="main">
			<div id="titlogo">
				<img src="images/kiflea-logo-v2-small.png">
				<h2 class="title">Kipdola's Flat Earth Engine</h2>
			</div>
			
			<div id="flatearth" width="480" height="480" class="canvascontainer"></div>
			<br/>
			<!--<button id="clearecho" onclick="k.links.echo.innerHTML = '';">Clear echo div</button>-->
			<button onclick="k.debug.showSettings();">Open settings</button>
			<button id="toggleengine" onclick="k.operations.toggleEngine();">Toggle engine</button>
			<button id="togglegrid" onclick="k.settings.debug.GRID=!k.settings.debug.GRID;">Toggle grid</button>
			<button id="togglefps" onclick="k.settings.debug.FPS=!k.settings.debug.FPS;">Toggle FPS</button><br/>
			
			<button id="togglegrid" onclick="k.settings.debug.DIRTY=!k.settings.debug.DIRTY;">Toggle dirty rectangles</button>
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
			<canvas id="moredebugcanvas" width="400" height="40" style="border:1px solid black;position:absolute;left:750px;"></canvas>
            <a class="FlattrButton" style="display:none;"
            href="http://www.kipdola.be/en/blog/skerit/126-presenting-kiflea-canvas-game-engine-html5"></a>
			<a href="http://kipdola.be/trac/repos/" style="padding: 0pt; border: medium none;">
				<img title="Trac" alt="trac_logo_mini.png" src="http://kipdola.be/trac/repos/chrome/common/trac_logo_mini.png"></a>
				A <a href="http://www.kipdola.be">Kipdola Studios production.</a>
				<a href="#" onclick="$('.one').toggle();">Toggle single errors</a>
			<hr>
			<div style="position:absolute;right:20px;top:100px;">
				<canvas id="debugcanvas" width="480" height="480" style="border:1px solid black;"></canvas><br/>
				<input id="sectornr" type="number" value="153"/>
			</div>
			<script type="text/javascript">
				var debugnr = 153;
				$('#sectornr').change(function(){
					debugnr = $('#sectornr').val();
					k.debug.drawSector(debugnr);
				});
			</script>
			
			<div id="frameecho"></div>
			<div id="echo"></div>
			<div id="debug"></div>
			
		</div>
	</div>
</body>