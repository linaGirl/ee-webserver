

	var   Class 	= require('ee-class')
		, Events 	= require('ee-event-emitter')
		, log 		= require('ee-log')
		, type 		= require('ee-types')
		, argv 		= require('ee-argv');


	var   url 		= require('url')
		, zlib 		= require('zlib');

	var   debug 	= argv.has('trace-webserver');


	module.exports = new Class( {
		inherits: Events


		, headers: {}
		, statusCode: 500



		, init: function(options) {
			Object.defineProperty(this, '_response', {value: options.response});
			Object.defineProperty(this, '_responseSent', {value: false, writable: true});

			this.request = options.request;

			// set up writable interface
			this.setUpStream();
		}


		, get isSent(){
			return this._responseSent;
		}


		, getResponse: function() {
			return this._response;
		}

		, setContentType: function(type) {
			this.setHeader('content-type', type);
		}

		, setCookie: function(cookie) {
			if (!this.headers.cookies) this.headers.cookies = [];
			this.setHeader('set-cookie', typeof cookie === 'string' ? cookie : cookie.toString());
			return this;
		}

		, setHeader: function(header, value) {
			if (!this.headers[header]) this.headers[header] = [];
			this.headers[header].push(value);
			return this;
		}

		, getHeaders: function() {
			return this.headers;
		}


		, setHeaders: function(headers) {
			if (headers) {
				Object.keys(headers || {}).forEach(function(key){
					this.setHeader(key, headers[key]);
				}.bind(this));
			}
			return this;
		}

		, removeHeader: function(header) {
			if (this.headers[header]) delete this.headers[header];
		}


		, send: function() {
			var   data = ''
				, headers = {}
				, statusCode = 200;

			if (this.isSent) {
				this.emit('error', new Error('Cannot send reponse, the response was already sent before. '+this.request.method+' request on '+this.request.pathname));
			}
			else {
				this._responseSent = true;
				
				// apply arguments
				Array.prototype.slice.call(arguments, 0).forEach(function(arg, index) {
					switch (type(arg)) {
						case 'number':
							statusCode = arg;
							break;

						case 'buffer':
						case 'string':
							data = arg;
							break;

						case 'object':
							headers = arg;
							break;

						case 'null':
						case 'undefined':
							// ignore this
							break;

						default:
							throw new Error('Argument '+index+' typeof '+type(arg)+' is invalid. Accepting Number as statusCode, Buffer or String for as data & object for headers!').setName('InvalidArgumentException');
					}
				}.bind(this));
				
				var acceptEncoding = this.request.getHeader('accept-encoding');
				
				if (data.length > 0 && acceptEncoding && acceptEncoding.indexOf('gzip') >= 0){
					if (debug) log.debug('compressing response ...');
					zlib.gzip(data, function(err, compressedData) {
						if (err) this._send(data, headers, statusCode);
						else {
							if (compressedData && compressedData.length > 0 && compressedData.length < data.length) {
								if (debug) log.debug('seding compressed response [' + compressedData.length + '] ( compressed ) vs [' + data.length + '] bytes ...');
								this._response.setHeader('content-encoding', 'gzip');
								this._send(compressedData, headers, statusCode, true);
							}
							else this._send(data, headers, statusCode);
						}
					}.bind(this));
				}
				else this._send(data, headers, statusCode);
			}
		}



		, _send: function(data, headers, statusCode, isCompressed) {
			this.setHeaders(headers);
			
			if (!data) data = '';
			if (typeof data === 'string') data = new Buffer(data);
			this.setHeader('Content-Length', data.length);
			this.setHeader('date', new Date().toGMTString());
			this.setHeader('server', 'fluffy');

			this._response.writeHead(statusCode || this.statusCode, this.headers);
			this._response.end( this.request.method.toLowerCase() === "head" ? undefined : data);

			if (debug) log.warn('sent status «'+statusCode+'» for the path [' + this.request.pathname + '] - headers:'), log.dir(this.headers);

			// emit send event
			this.emit('send', (statusCode || this.statusCode), this.request.method.toLowerCase() === "head" ? undefined : data, isCompressed);

			return this;
		} 


		, sendCompressed: function(data, headers, statusCode) {
			if (!data) data = '';
			if (!statusCode) statusCode = 200;
			if (!headers) headers = {};

			headers['content-encoding'] = 'gzip';

			this._send(data, headers, statusCode);
		}


		, sendUncompressed: function(data, headers, statusCode) {
			if (!data) data = '';
			if (!statusCode) statusCode = 200;
			if (!headers) headers = {};

			this._send(data, headers, statusCode);
		}



		// implement streaming interface ( writable stream v2 )
		, setUpStream: function() {
			this.on('listener', this.handleListener.bind(this));
		}

		, write: function() {
			return this._response.write.apply(this._response, Array.prototype.slice.call(arguments, 0));
		}

		, end: function() {
			this._responseSent = true;
			return this._response.end.apply(this._response, Array.prototype.slice.call(arguments, 0));
		}

		, handleListener: function(evt, listener) {
			switch( evt ){
				case 'drain':
				case 'finish':
				case 'pipe':
				case 'unpipe':
				case 'close':
					this._response.on(evt, listener);
			}
		}
	});