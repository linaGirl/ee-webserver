

	var   Class 		= require( "ee-class" )
		, Events 		= require( "ee-event" )
		, log 			= require( "ee-log" )
		, Waiter 		= require( "ee-waiter" )
		, project 		= require( "ee-project" );

	var   HTTPServer 	= require( "./HTTPServer" )
		, HTTPSServer 	= require( "./HTTPSServer" );



	module.exports = new Class( {
		inherits: Events

		// the servers configuration
		, config: {}


		// constants
		, "static IF_PUBLIC": 1			// listen on all public interfaces
		, "static IF_PRIVATE": 2		// listen on all private interfaces ( RFC 1918, 192.168.x.y, 10.x.y.z, 172.16.x.y - 172.31.x.y, fc00:: )
		, "static IF_INTERNAL": 3 		// lis§ten on localhost ( 127.0.0.1, ::1, fe80::1 )
		, "static IF_LOCAL": 4 			// link local 169.254.1.x to 169.254.254.y, fe80::
		, "static IF_ANY": 5			// listen on any interface
		, "static IF_V4_PRIVATE": 10	// private v4 interfaces
		, "static IF_V6_PRIVATE": 20 	// private v6 interfaces
		, "static IF_V4_INTERNAL": 11 	// 127.0.0.1
		, "static IF_V6_INTERNAL": 21 	// fc00::
		, "static IF_V4_PUBLIC": 12
		, "static IF_V6_PUBLIC": 22
		, "static IF_V4_LOCAL": 13 		// §169.254.1.x to 169.254.254.y
		, "static IF_V6_LOCAL": 23 		// fe80::
		, "static IF_V4_ANY": 14
		, "static IF_V6_ANY": 24

		, "static PORT_ANY": -1 		// automagically lsiten on any port


		, init: function( options ){

			// load configuration
			this.__parseConfig( options );


			// event emitter proxy
			var emit = function( evt, args ){
				args = Array.prototype.splice.call( args, 0 );
				args.unshift( evt );
				this.emit.apply( this, args );
			}.bind( this );


			// load configured servers
			if ( this.config.http ) {
				this.http = new HTTPServer( { 
					config: this.config.http
					, on: {
						request: function(){ emit( "request", arguments ); }
					}
				} );
			}
			if ( this.config.https ) {
				this.https = new HTTPSServer( { 
					config: this.config.https
					, on: {
						request: function(){ emit( "request", arguments ); }
					}
				} );
			}
		}



		, listen: function( callback ){
			var waiter = new Waiter();

			if ( this.http ) waiter.add( function( cb ){ this.http.listen( cb ); }.bind( this ) );
			if ( this.https ) waiter.add( function( cb ){ this.https.listen( cb ); }.bind( this ) );

			waiter.start( function(){
				this.emit( "lsitening" );
				if ( typeof callback === "function" ) callback();
			}.bind( this ) );
		}



		, __parseConfig: function( options ){

			// get http config from options, config
			if ( options.http ) this.config.http = options.http;
			else if ( project.config && project.config.webserver && project.config.webserver.http ) this.config.http = project.config.webserver.http;
			
			// get https config from options, config
			if ( options.https ) this.config.https = options.https;
			else if ( project.config && project.config.webserver && project.config.webserver.https ) this.config.https = project.config.webserver.https;
		}
	} );