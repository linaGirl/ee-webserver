

	var   Class 	= require( "ee-class" )
		, Events 	= require( "ee-event" )
		, log 		= require( "ee-log" )
		, Waiter 	= require( "ee-waiter" );

	var   http 		= require( "http" );

	var   Server 	= require( "./Server" )
		, Request 	= require( "./Request" )
		, Response 	= require( "./Response" );



	module.exports = new Class( {
		inherits: Server



		, init: function( options ){
			// init
			this.parent.init.call( this, options );			
		}



		, handleRequest: function( req, res ){
			var   request 		= new Request( { request: req } )
			 	, response 		= new Response( { response: res, request: request } );

			this.emit( "request", request, response );
		}



		, listen: function( callback ){
			var server
				, waiter = new Waiter()
				, emit = function( evt, args ){
					args = Array.prototype.splice.call( args, 0 );
					args.unshift( evt );
					this.emit.apply( this, args );
				}.bind( this )
				, i = this.interfaces.length;

			while( i-- ) {
				if( this.interfaces[ i ].listen ){
					( function( iface ){
						waiter.add( function( cb ){
							server = http.createServer();

							server.on( "request", this.handleRequest.bind( this ) );
							server.on( "connection", 	function(){ emit( "connection", arguments ); } );
							server.on( "close", 		function(){ emit( "close", arguments ); } );
							server.on( "checkcontinue",	function(){ emit( "checkcontinue", arguments ); } );
							server.on( "connect", 		function(){ emit( "connect", arguments ); } );
							server.on( "upgrade", 		function(){ emit( "upgrade", arguments ); } );
							server.on( "clientError", 	function(){ emit( "clientError", arguments ); } );
								
							server.listen( this.port, iface.address, function( err ){
								if ( err ) this.emit( "error", err );
								else log.info( "HTTP Server listening on [" + iface.address + "]:" + this.port + "", this );
								cb();
							}.bind( this ) );

							this.servers.push( server );
						}.bind( this ) );						
					}.bind( this ) )( this.interfaces[ i ] );
				}
			}

			waiter.start( function( err ){
				if ( typeof callback === "function" ) callback( err );
			}.bind( this ) );
		}
	} );