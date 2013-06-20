

	var   Class 	= require( "ee-class" )
		, Events 	= require( "ee-event" )
		, log 		= require( "ee-log" )
		, argv 		= require( "ee-argv" );


	var   url 		= require( "url" )
		, zlib 		= require( "zlib" );

	var   debug 	= argv.has( "trace-webserver" );


	module.exports = new Class( {
		inherits: Events


		, __headers: {}
		, __statusCode: 500
		, __responseSent: false


		, init: function( options ){
			this.__response = options.response;
			this.__request = options.request;
		}


		, get isSent(){
			return this.__responseSent;
		}


		, setContentType: function( type ){
			this.setHeader( "content-type", type );
		}

		, setCookie: function( cookie ){
			if ( ! this.__headers.cookies ) this.__headers.cookies = [];
			this.setHeader( "set-cookie", typeof cookie === "string" ? cookie : cookie.toString() );
			return this;
		}

		, setHeader: function( header, value ){
			if ( ! this.__headers[ header ] ) this.__headers[ header ] = [];
			this.__headers[ header ].push( value );
			return this;
		}


		, setHeaders: function( headers ){
			if ( headers ){
				var keys = Object.keys( headers ), i = keys.length;
				while( i-- ) this.setHeader( keys[ i ], headers[ keys[ i ] ] );
			}
			return this;
		}

		, removeHeader: function( header ){
			if ( this.__headers[ header ] ) delete this.__headers[ header ];
		}


		, send: function( data, headers, statusCode ){
			if ( !data ) data = "";
			if ( !statusCode ) statusCode = 200;
			if ( !headers ) headers = {};
			
			var acceptEncoding = this.__request.getHeader( "accept-encoding" );
			
			if ( acceptEncoding && acceptEncoding.indexOf( "gzip" ) >= 0 ){
				if ( debug ) log.debug( "compressing response ..." );
				zlib.gzip( data, function( err, compressedData ){
					if ( err ) this.__send( data, headers, statusCode );
					else {
						if ( compressedData.length < data.length ){
							if ( debug ) log.debug( "seding compressed response [" + compressedData.length + "] ( compressed ) vs [" + data.length + "] bytes ..." );
							this.__response.setHeader( "content-encoding", "gzip" );
							this.__send( compressedData, headers, statusCode );
						}
						else {
							this.__send( data, headers, statusCode );
						}						
					}
				}.bind( this ) );
			}
			else {
				this.__send( data, headers, statusCode );
			}	
		}



		, __send: function( data, headers, statusCode ){
			this.setHeaders( headers );
			
			if ( !data ) data = "";
			if ( typeof data === "string" ) data = new Buffer( data );
			this.setHeader( "Content-Length", data.length );
			this.setHeader( "date", new Date().toGMTString() );
			this.setHeader( "server", "iridium" );

			this.__response.writeHead( statusCode || this.__statusCode, this.__headers );
			this.__response.end( this.__request.method.toLowerCase() === "head" ? undefined : data );
			this.__responseSent = true;

			if ( debug ) log.warn( "sent response for [" + this.__request.pathname + "] - headers:" ), log.dir( this.__headers );

			return this;
		} 



		, sendUncompressed: function( data, headers, statusCode ){
			if ( !data ) data = "";
			if ( !statusCode ) statusCode = 200;
			if ( !headers ) headers = {};

			this.__send( data, headers, statusCode );
		}
	} );