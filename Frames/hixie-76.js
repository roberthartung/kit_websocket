function Frame(arg)
{
	if(typeof arg == 'object')
	{
		// read frame from Buffer object
		
		// Skip 0x00 at the beginning
		arg = arg.slice(1);
		
		this.message = new Buffer(arg.length-1);
		// Skip 0xff at the end
		arg.copy(this.message, 0, 0, arg.length - 1);
	}
	else if(typeof arg === 'string')
	{
		this.byteStream = Buffer.concat([new Buffer('00', 'hex'), new Buffer(arg), new Buffer('FF', 'hex')]);
	}
}

module.exports = Frame;