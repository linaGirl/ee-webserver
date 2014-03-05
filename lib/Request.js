

	var   Class 		= require('ee-class')
		, Events 		= require('ee-event-emitter')
		, log 			= require('ee-log');

	var   url 			= require('url')
		, querystring 	= require('querystring');

	

	module.exports = new Class({
		inherits: Events


		, _requestsWithBodyData: ['post', 'patch', 'put', 'delete']


		// remote IP address
		, get ip() {
			return this.getHeader('x-forwarded-for') || this._request.connection.remoteAddress || null;
		}

		// return the ip of the requeter
		, get requestIp() {
			return this._request.connection.remoteAddress || null;
		}

		// return the forwarded ip
		, get forwardedIp() {
			return this.getHeader('x-forwarded-for') || null;
		}

		// request language defined by url ( if enabled ), cookie ( if enabled ) or accept-language HTTP header
		, get language() {
			return this._getRequestLanguage();
		}

		, set language(newLang) {
			this._language = newLang;
		}


		// the pathname ( without the language part )
		, get pathname() {
			try{		
				return decodeURIComponent(this.getUri().pathname || "");
			} catch (e){
				return this.getUri().pathname;
			}
		}

		, set pathname(newPath) {
			this._uri.pathname = newPath;
		}

		, get hostname() {			
			return this.getUri().hostname;
		}

		, get url() {
			return this.__request.url;
		}

		, get query() {	
			return this.getUri().query;
		}	

		, get querystring(){	
			return  url.parse(this._request.url).query || "";
		}

		, set query(query){
			this.getUri().query = query;
		}



		, init: function(options) {

			// the node.js request object			
			Object.defineProperty(this, '_request', {value: options.request});

			// method
			this.method = this._request.method.toLowerCase();

			// set up readable interface
			this.setUpStream();
		}



		, setResponse: function(response) {
			this.response = response;
		}


		// the request language is defined as follows:
		// 1. if set the first part of the url ( /en/user/1 -> en )
		// 2. if set the language cookie ( language=de -> de )
		// 3. if set via http accept-language header 
		, _getRequestLanguage: function(){
			if (this._language) return this.__language; // cached
			else {
				this._language = null;

				var langHeader = this.getHeader("accept-language", true);

				if (langHeader.length){
					this._language = langHeader[0].key.toLowerCase();
				}
			}

			// return from cache
			return this._language; 
		}


		, getCookie: function(cookiename) {
			return (new RegExp(cookiename + '=([^;]+)(?:;|$)', 'gi').exec( his.getHeader('cookie')) || [null, null])[1];
		}

		, getHeader: function(name, parsed) {
			name = (typeof name === 'string' ? name.toLowerCase() : '');
			
			if (this._request.headers[name]) {
				if (parsed) {
					return this.parseHeader(this._request.headers[name])
				}
				else {
					return this._request.headers[name];
				}
			}
			return null;
		}


		, getHeaders: function() {
			return this._request.headers;
		}

		, hasHeader: function(name) {
			return !!this._request.headers[name];
		}
		
		, getUri: function() {
			if (!this._uri) this._uri = url.parse('http://' + this._request.headers.host + this._request.url, true);
			return this._uri;
		}

		, getRequest: function() {
			return this._request;
		}

		, parseHeader: function(header) {
			var parts = header.split(',').map(function(part) {
				var items = /^([a-z0-9\.\+\*]+)[\/\-]?([a-z0-9\.\+\*]*)\;?q?=?([0-9\.]*)$/gi.exec(part.trim());
				
				return {
					  key: 		items && items[1] ? items[1].toLowerCase() : ''
					, value: 	items && items[2] ? items[2].toLowerCase() : ''
					, q: 		items && items[3] ? parseInt(items[3], 10) : 1
				};
			}).sort(function(a, b) {
				return a.q > b.q ? -1 : 1;
			});

			return parts.length > 0 ? parts: null;
		}



		// implement streaming interface ( readle stream v2 )
		, setUpStream: function() {
			this.on('listener', this.handleListener.bind(this));
		}


		, read: function() {
			return this._request.read.apply( this.__request, Array.prototype.slice.call(arguments, 0));
		}
		, setEncoding: function() {
			return this._request.setEncoding.apply(this._request, Array.prototype.slice.call(arguments, 0));
		}
		, resume: function() {
			return this._request.resume.apply(this._request, Array.prototype.slice.call(arguments, 0));
		}
		, pause: function() {
			return this._request.pause.apply(this._request, Array.prototype.slice.call(arguments, 0));
		}
		, pipe: function() {
			return this._request.pipe.apply(this._request, Array.prototype.slice.call(arguments, 0));
		}
		, unpipe: function() {
			return this._request.unpipe.apply(this._request, Array.prototype.slice.call(arguments, 0));
		}
		, unshift: function() {
			return this._request.unshift.apply(this._request, Array.prototype.slice.call(arguments, 0));
		}
		, wrap: function() {
			return this._request.wrap.apply(this._request, Array.prototype.slice.call(arguments, 0));
		}


		, handleListener: function(evt, listener) {
			switch( evt ){
				case 'readable':
				case 'data':
				case 'end':
				case 'close':
				case 'error':
					this._request.on(evt, listener);
			}
		}



		, abort: function(code) {
			this._request.pause();

			this.response.send(null, null, code || 500);

			this.response.on('close', function() {
				this._request.socket.destroy();
			}.bind(this));
		}
	} );