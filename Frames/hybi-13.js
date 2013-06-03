function Frame(arg, compression)
{
	this.compression = compression;

	if(typeof arg == 'object')
	{
		// read frame from Buffer object
		this.createFromBuffer(arg);
	}
	else if(typeof arg === 'string')
	{
		//var bytes = [];
		this.isFin = 1; // last frame segment
		this.opcode = 1; // text frame
		this.isMasked = 0;
		this.payloadLength = arg.length;
		var b = new Buffer(2 + arg.length);
		
		//bytes.push();
		//bytes.push();
		
		b[0] = this.isFin << 7 | this.opcode;
		b[1] = this.isMasked << 7 | this.payloadLength;

		for(var o=0; o<arg.length; o++)
		{
			b[2+o] = arg.charCodeAt(o);
		}
		
		/*
		this.byteStream = '';
		for(b=0;b<bytes.length;b++)
		{
			console.log(b, bytes[b].toString(16));
			
			var chr = String.fromCharCode(bytes[b]);
			this.byteStream += chr;
		}
		
		this.byteStream += arg;
		*/
		
		this.byteStream = b;
	}
}

Frame.prototype.createFromBuffer = function(buffer)
{
	this.isFin = buffer.readUInt8(0) & 0x80;
	
	var str = buffer.toString('hex');
	var bitOffset = 0;
	
	function readBits(num)
	{
		var val = 0;
		for(b=0;b<num;b++)
		{
			var bytePos = Math.floor(bitOffset / 8);
			var bitPosition = bitOffset % 8;
			
			// get 
			var bit = buffer.readUInt8(bytePos) & ((1 << 7) >> bitPosition);
			bit >>= (7 - bitPosition);
			
			//console.log('bytePos:', bytePos, 'bitOffset:', bitPosition, 'bit:', bit);
			// MSB is read first
			val |= bit << (num - b - 1);
			val = val >>> 0; // fix for 32bit number
			bitOffset++;
		}
		return val;
	}
	
	// read 1 bit
	this.length = 2;
	this.isFin = readBits(1);
	this.rsv = readBits(3);
	this.isDeflated = this.rsv & 0x4 ? 1 : 0;
	this.opcode = readBits(4);
	this.isMasked = readBits(1);
	this.payloadLength = readBits(7);
	
	// 1 4 1 1 5
	console.log(this.isFin, this.rsv, this.opcode, this.isMasked, this.payloadLength);
	
	switch(this.opcode)
	{
		case 0 : // continuation frame
			return;
		break;
		case 6 :
			return;
		break;
		case 1 : // text frame
			
		break;
	}
	
	if(this.payloadLength == 126)
	{
		this.length += 2;
		this.payloadLength = readBits(16);
	}
	else if(this.payloadLength == 127)
	{
		this.length += 8;
		// @todo we should use .read... functions here
		readBits(64);
	}
	
	var mask;
	if(this.isMasked)
	{
		this.length += 4;
		this.maskingKey = readBits(32);
		mask = [((this.maskingKey >>> 24) & 0xFF), ((this.maskingKey >>> 16) & 0xFF), ((this.maskingKey >>> 8) & 0xFF), ((this.maskingKey >>> 0) & 0xFF)];
		//console.log('maskingKey:', this.maskingKey, this.maskingKey.toString(16), this.mask);
	}
	// no mask => mask with 1
	else
	{
		mask = [0xFF, 0xFF, 0xFF, 0xFF];
	}
	
	var byteOffset = bitOffset / 8;
	//var messageLength = byteOffset+this.payloadLength;
	
	this.message = new Buffer(this.payloadLength, 'utf8');
	//this.message_raw1 = new Buffer(messageLength + 4, 'hex');
	//this.message_raw2 = new Buffer(messageLength + 4, 'utf8');
	var maskOffset = 0;
	var i = 0;
	// buffer.length
	this.length+= this.payloadLength;
	//console.log(byteOffset, byteOffset+this.payloadLength);
	for(var b=byteOffset;b<byteOffset+this.payloadLength;b++)
	{
		//this.message_raw1[i] = buffer.readUInt8(b);
		//this.message_raw2[i] = buffer.readUInt8(b);
	
		//console.log(b + ': ' + buffer.readUInt8(b).toString(16));
	
		var chrCode = buffer.readUInt8(b) ^ mask[maskOffset];
		//console.log('chrCode:', i,  String.fromCharCode(chrCode));
		this.message[i++] = chrCode;
		//console.log(chrCode, chrCode.toString(16));
		//this.message += String.fromCharCode(chrCode);
		maskOffset = (maskOffset + 1) % mask.length;
	}
	
	/*
	this.message_raw1[i++] = 0x00;
	//this.message_raw1[i++] = 0x00;
	this.message_raw1[i++] = 0xFF;
	this.message_raw1[i++] = 0xFF;
	
	//console.log('this.message:', this.message);
	//console.log('raw message1:', this.message_raw1);
	console.log('raw message1:', this.message_raw1);
	
	zlib.inflate(this.message_raw1, function()
	{
		console.log(arguments);
	});
	*/

	/*
	if(this.isDeflated)
	{
		this.message = new Buffer(this.message + '\x00\x00\xFF\xFF', 'utf8');
		//console.log('this.message:', this.message, this.message.toString('hex'));
		zlib.inflate(this.message, function()
		{
			console.log(arguments);
		});
	}
	*/
	
	this.message = this.message.toString();
}

module.exports = Frame;