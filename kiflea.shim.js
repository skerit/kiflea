/**
 * Make sure every required function exists, with or without fallbacks
 */

if (window.WebSocket) {
	Websock_native = true;
} else if (window.MozWebSocket) {
	Websock_native = true;
	window.WebSocket = window.MozWebSocket;
} else {
	document.write('<script type="text/javascript" src="web-socket-js/swfobject.js"></script>');
	document.write('<script type="text/javascript" src="web-socket-js/web_socket.js"></script>');
	WEB_SOCKET_SWF_LOCATION = "web-socket-js/WebSocketMain.swf";
}

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
		  window.webkitRequestAnimationFrame || 
		  window.mozRequestAnimationFrame    || 
		  window.oRequestAnimationFrame      || 
		  window.msRequestAnimationFrame     || 
		  function(/* function */ callback, /* DOMElement */ element){
			window.setTimeout(callback, 1000 / 60);
		  };
})();