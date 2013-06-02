var events = require("events"),
	util = require("util");
	
var Frame = require('./Frame');

function Connection(socket)
{
	events.EventEmitter.call(this);
	var connection = this;
	socket.setNoDelay(true);
	socket.setTimeout(0);
	
	socket.on('data', function(buffer)
	{
		var bufferOffset = 0;
		do
		{
			var buf = buffer.slice(bufferOffset);
			var frame = new Frame(buf, 0);
			//console.log('<<< "'+frame.message+'"');
			connection.emit('data', frame.message);
			bufferOffset += frame.length;
		}
		while(bufferOffset + 1 < buffer.length); // got more frames?
	});
	
	socket.on('end', function()
	{
		connection.emit('disconnect');
	});
	
	this.send = function(msg)
	{
		var frame = new Frame(msg);
		socket.write(frame.byteStream, 'binary');
	}
}

util.inherits(Connection, events.EventEmitter);

module.exports = Connection;