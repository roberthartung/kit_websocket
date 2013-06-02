/**
 * Websocket Module
 *
 * @author Robert Hartung
 */

var crypto = require('crypto'),
	zlib = require("zlib"),
	events = require("events"),
	util = require("util");

var Connection = require('./Connection');
	
module.exports = function(httpServer)
{
	function WebSocket()
	{	
		events.EventEmitter.call(this);
		var webSocket = this
		var connections = [];
		
		function onUpgrade(request, socket)
		{
			// request.url
			shasum = crypto.createHash('sha1');
			shasum.update(request.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11');
			var accept_key = shasum.digest('base64');
			
			socket.write("HTTP/1.1 101 Switching Protocols\r\n");
			socket.write("Upgrade: " + request.headers.upgrade + "\r\n");
			socket.write("Connection: Upgrade\r\n");
			
			if(request.headers['sec-websocket-extensions'] == 'x-webkit-deflate-frame')
			{
				//socket.write("Sec-WebSocket-Extensions: x-webkit-deflate-frame\r\n");
				//client.deflate = 1;
			}
			socket.write("Sec-WebSocket-Accept: " + accept_key + "\r\n");
			if(request.headers.origin)
				socket.write("WebSocket-Origin: "+request.headers.origin+"\r\n");
			if(request.headers['sec-websocket-protocol'])
				socket.write("WebSocket-Protocol: "+request.headers['sec-websocket-protocol']+"\n");
			socket.write("\r\n");
			
			var connection = new Connection(socket);
			webSocket.emit('connect', connection);
			connections.push(connection);
		}
		
		httpServer.on('upgrade', onUpgrade);
	}
	util.inherits(WebSocket, events.EventEmitter);
	return new WebSocket();
}