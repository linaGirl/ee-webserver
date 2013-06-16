

	var   Class 	= require( "ee-class" )
		, Events 	= require( "ee-event" )
		, log 		= require( "ee-log" );

	var   http 		= require( "http" );

	var   WebServer = require( "./index" );


	module.exports = new Class( {
		inhertis: Events

		// the servers configuration
		, config: {}
		, servers: []


		, init: function( options ){
			this.config = options.config;

			this.__parseInterfaceConfig();

			if ( this.config.port ) this.port = this.config.port;
		}



		, __parseInterfaceConfig: function(){
			var interfaces = os.networkInterfaces()
				, keys = Object.keys( interfaces )
				, m = keys.length
				, interfaces = []
				, i = 0
				, k = 0
				, config, iface;

			this.interfaces = [];

			while( m-- ){
				interfaces[ keys[ m ] ].forEach( function( iface ){
					this.interfaces.push( {
						  public: 	!/^(?:192\.168\.|10\.|172\.(?:1[6-9]|2[0-9]|3[0-1])\.|f[cd][0-9a-f]{2}:|fe[89ab]|169\.254\.(?:[1-9]|1[0-9]{1,2}|2[0-9]|2[0-4][0-9]|25[0-4])|127\.0\.0\.1|\:\:1)/gi.test( iface.address )
						, private: 	/^(?:192\.168\.|10\.|172\.(?:1[6-9]|2[0-9]|3[0-1])\.|f[cd][0-9a-f]{2}:)/gi.test( iface.address )
						, local: 	/^(?:fe[89ab]|169\.254\.(?:[1-9]|1[0-9]{1,2}|2[0-9]|2[0-4][0-9]|25[0-4]))/gi.test( iface.address )
						, internal: iface.internal
						, family: 	iface.family
						, address: 	iface.address
					} );
				}.bind( this ) );
			}


			if ( this.config.interface ) interfaces.push( this.config.interface );
			else if ( this.config.interfaces ) interfaces = this.config.interfaces;
			else interfaces = [ WebServer.IF_ANY ];
			

			i = interfaces.length;
			while( i-- ){
				k = this.interfaces.length;
				while( k-- ){
					config = interfaces[ i ];
					iface = this.interfaces[ k ];

					if ( config.toLowerCase() === iface.address.toLowerCase() ) 			iface.listen = true;

					else if ( config === WebServer.IF_ANY ) 								iface.listen = true;
					else if ( config === WebServer.IF_PUBLIC && iface.public ) 				iface.listen = true;
					else if ( config === WebServer.IF_PRIVATE && iface.private ) 			iface.listen = true;
					else if ( config === WebServer.IF_LOCAL && iface.local ) 				iface.listen = true;
					else if ( config === WebServer.IF_INTERNAL && iface.internal )  		iface.listen = true;

					else if ( config === WebServer.IF_V4_ANY && iface.family === "IPv4" ) 							iface.listen = true;
					else if ( config === WebServer.IF_V4_PUBLIC && iface.family === "IPv4" && iface.public ) 		iface.listen = true;
					else if ( config === WebServer.IF_V4_PRIVATE && iface.family === "IPv4" && iface.private ) 		iface.listen = true;
					else if ( config === WebServer.IF_V4_LOCAL && iface.family === "IPv4" && iface.local ) 			iface.listen = true;
					else if ( config === WebServer.IF_V4_INTERNAL && iface.family === "IPv4" && iface.internal ) 	iface.listen = true;
				
					else if ( config === WebServer.IF_V6_ANY && iface.family === "IPv6" ) 							iface.listen = true;
					else if ( config === WebServer.IF_V6_PUBLIC && iface.family === "IPv6" && iface.public ) 		iface.listen = true;
					else if ( config === WebServer.IF_V6_PRIVATE && iface.family === "IPv6" && iface.private ) 		iface.listen = true;
					else if ( config === WebServer.IF_V6_LOCAL && iface.family === "IPv6" && iface.local ) 			iface.listen = true;
					else if ( config === WebServer.IF_V6_INTERNAL && iface.family === "IPv6" && iface.internal ) 	iface.listen = true;
				}
			}
		}
	} );