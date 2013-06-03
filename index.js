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
			
			socket.write("HTTP/1.1 101 WebSocket Protocol Handshake\r\n");
			socket.write("Upgrade: " + request.headers.upgrade + "\r\n");
			socket.write("Connection: Upgrade\r\n");
			
			console.log(request.headers);
			
			if(request.headers['sec-websocket-extensions'] == 'x-webkit-deflate-frame')
			{
				//socket.write("Sec-WebSocket-Extensions: x-webkit-deflate-frame\r\n");
				//client.deflate = 1;
			}
			
			socket.write("Sec-WebSocket-Accept: " + accept_key + "\r\n");
			socket.write("Sec-WebSocket-Location: ws://" + request.headers.host +"/\r\n");
			if(request.headers.origin)
			{
				socket.write("WebSocket-Origin: "+request.headers.origin+"\r\n");
				socket.write("Sec-WebSocket-Origin: "+request.headers.origin+"\r\n");
				
			}
			if(request.headers['sec-websocket-protocol'])
				socket.write("WebSocket-Protocol: "+request.headers['sec-websocket-protocol']+"\r\n");
			
			var protocol = 'hybi-13';
			
			socket.write("\r\n");
			
			if(request.headers['sec-websocket-key1'] && request.headers['sec-websocket-key2'])
			{
				protocol = 'hixie-76';
				var key1 = request.headers['sec-websocket-key1'];
				var key2 = request.headers['sec-websocket-key2'];
				
				console.log(key1, key2);
				
				var num1 = '';
				var num2 = '';
				
				for(var c=0;c<key1.length;c++)
				{
					var chrCode = key1.charCodeAt(c);
					
					if(chrCode >= 48 && chrCode <= 57)
					{
						num1 += key1[c];
					}
				}
				
				for(var c=0;c<key2.length;c++)
				{
					var chrCode = key2.charCodeAt(c);
					
					if(chrCode >= 48 && chrCode <= 57)
					{
						num2 += key2[c];
					}
				}
				
				num1 = parseInt(num1) / (key1.split(" ").length - 1);
				num2 = parseInt(num2) / (key2.split(" ").length - 1);
				
				socket.once('data', function(data)
				{
					var hex1 = num1.toString(16);
					var hex2 = num2.toString(16);
					var hex3 = data.toString('hex');
					
					while(hex1.length < 8)
					{
						hex1 = '0' + hex1;
					}
					
					while(hex2.length < 8)
					{
						hex2 = '0' + hex2;
					}
					
					while(hex3.length < 8)
					{
						hex3 = '0' + hex3;
					}
					
					var h = hex1 + hex2 + hex3;
					
					//console.log('h:', h);
					
					var b = new Buffer(h, 'hex');
					
					md5 = crypto.createHash('md5');
					md5.update(b);
					var bin = md5.digest('binary');
					
					md5 = crypto.createHash('md5');
					md5.update(b);
					var hex = md5.digest('hex');
					
					socket.write(bin, 'binary');
					var connection = new Connection(socket, protocol);
					webSocket.emit('connect', connection);
					connections.push(connection);
				});
			}
			else
			{
				var connection = new Connection(socket, protocol);
				webSocket.emit('connect', connection);
				connections.push(connection);
			}
		}
		
		httpServer.on('upgrade', onUpgrade);
	}
	util.inherits(WebSocket, events.EventEmitter);
	return new WebSocket();
}