

	var   Class 	= require( "ee-class" )
		, Events 	= require( "ee-event" )
		, log 		= require( "ee-log" );

	var   http 		= require( "http" );

	var   Server 	= require( "./Server" );



	module.exports = new Class( {
		inherits: Server



		, init: function( options ){			

			// init
			this.__prototype__.__prototype__.init.call( this, options );			
		}


		, listen: function( callback ){
			var server
				, i = this.interfaces.length;

			while( i-- ) {
				if( this.interfaces[ i ].listen ){
					server = http.createServer();
					server.listen( this.port, this.interfaces[ i ].address );
					this.servers.push( server );
				}
			}
		}
	} );