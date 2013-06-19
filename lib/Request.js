

	var   Class 		= require( "ee-class" )
		, Events 		= require( "ee-event" )
		, log 			= require( "ee-log" );

	var   url 			= require( "url" )
		, querystring 	= require( "querystring" );



	module.exports = new Class( {
		inherits: Events


		, __requestsWithBodyData: [ "post", "patch", "put", "delete" ]


		// remote IP address
		, get ip(){
			return this.getHeader( "x-forwarded-for" ) || this.__request.connection.remoteAddress || "";
		}


		// request language defined by url ( if enabled ), cookie ( if enabled ) or accept-language HTTP header
		, get language(){
			return this.__getRequestLanguage();
		}

		, set language( newLang ){
			this.__language = newLang;
		}


		// the pathname ( without the language part )
		, get pathname(){
			try{		
				return decodeURIComponent( this.getUri().pathname || "" );
			} catch ( e ){
				//log.trace( e );
				//log.info( this.getUri().pathname );
				return this.getUri().pathname;
			}
		}

		, set pathname( newPath ){
			this.__uri.pathname = newPath;
		}

		, get hostname(){			
			return this.getUri().hostname;
		}

		, get url(){
			return this.__request.url;
		}

		, get query(){	
			return this.getUri().query;
		}	

		, get querystring(){	
			return  url.parse( this.__request.url ).query || "";
		}

		, set query( query ){
			this.getUri().query = query;
		}



		, init: function( options ){

			// the node.js request object			
			this.__request = options.request;

			// method
			this.method = this.__request.method.toLowerCase();

			// cache request data
			this.__cacheData();

			// fire the end event even if the request has ended already
			this.on( "listener", function( evt, fn ){
				if ( evt === "end" && this.__ended ) fn();
			}.bind( this ) );
		}




		// the request language is defined as follows:
		// 1. if set the first part of the url ( /en/user/1 -> en )
		// 2. if set the language cookie ( language=de -> de )
		// 3. if set via http accept-language header 
		, __getRequestLanguage: function(){
			if ( this.__language ) return this.__language; // cached
			else {
				this.__language = null;

				var langHeader = this.getHeader( "accept-language", true );

				if ( langHeader.length > 0 ){
					if ( !this.__supportedLanguages && /^[a-z]{2}$/gi.test( langHeader[ 0 ].value ) ){
						// the language with the highest q value
						this.__language = langHeader[ 0 ].value.toLowerCase();
						return this.__language;
					}
					else {
						for ( var i = 0, l = langHeader.length; i < l; i++ ){
							if ( /^[a-z]{2}$/gi.test( langHeader[ i ].value ) && this.__supportedLanguages.indexOf( langHeader[ i ].value.toLowerCase() ) >= 0 ){
								this.__language = langHeader[ i ].value.toLowerCase();
								break;
							}
						}
					}
				}
			}

			// return from cache
			return this.__language; 
		}


		, getCookie: function( cookiename ){
			return ( new RegExp( cookiename + "=([^;]+)(?:;|$)", "gi" ).exec( this.getHeader( "cookie" ) ) || [ null, null ] )[ 1 ];
		}

		, getHeader: function( name, parsed ){
			if ( this.__request.headers[ name ] ){
				if ( parsed ){
					return this.__parseHeader( this.__request.headers[ name ] )
				}
				else {
					return this.__request.headers[ name ]
				}
			}
			return null;
		}

		, hasHeader: function( name ){
			return !!this.__request.headers[ name ];
		}
		
		, getUri: function(){
			if ( ! this.__uri ) this.__uri = url.parse( "http://" + this.__request.headers.host + this.__request.url, true );
			return this.__uri;
		}

		, getRequest: function(){
			return this.__request;
		}

		, __parseHeader: function( header ){
			var parts = header.split( "," ).map( function( part ){
				var items = /^([a-z0-9\.\+\*]+)[\/\-]?([a-z0-9\.\+\*]*)\;?q?=?([0-9\.]*)$/gi.exec( part );
				
				return {
					  key: 			items && items[ 1 ] ? items[ 1 ].toLowerCase() : ""
					, value: 		items && items[ 2 ] ? items[ 2 ].toLowerCase() : ""
					, q: 			items && items[ 3 ] ? items[ 3 ] : 1
				};
			} ).sort( function( a, b ){ return a.q > b.q ? -1 : 1 } );
			return parts.length > 0 ? parts: null;
		}


		, __cacheData: function(){
			if ( this.__requestsWithBodyData.indexOf( this.method ) >= 0 ){
				var data, data2;

				this.request.on( "data", function( chunk ){
					this.emit( "data", chunk  );

					if ( !data ) data = chunk;
					else {
						data2 = new Buffer( data.length + chunk.length );
						data.copy( data2 );
						chunk.copy( data2, data.length );
						data = data2;
					}
				}.bind( this ) );

				this.__request.on( "end", function(){
					this.data = data;
					this.ended = true;
					this.emit( "end" );
				}.bind( this ) );
			}
		}
	} );