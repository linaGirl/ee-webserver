

	var   Class 	= require( "ee-class" )
		, Events 	= require( "ee-event" )
		, log 		= require( "ee-log" );

	var   http 		= require( "http" )
		, os 		= require( "os" );


	module.exports = new Class( {
		inherits: Events

		// the servers configuration
		, config: {}
		, servers: []



		// constants
		, IF_PUBLIC: 1			// listen on all public interfaces
		, IF_PRIVATE: 2			// listen on all private interfaces ( RFC 1918, 192.168.x.y, 10.x.y.z, 172.16.x.y - 172.31.x.y, fc00:: )
		, IF_INTERNAL: 3 		// lis§ten on localhost ( 127.0.0.1, ::1, fe80::1 )
		, IF_LOCAL: 4 			// link local 169.254.1.x to 169.254.254.y, fe80::
		, IF_ANY: 5				// listen on any interface
		, IF_V4_PRIVATE: 10		// private v4 interfaces
		, IF_V6_PRIVATE: 20 	// private v6 interfaces
		, IF_V4_INTERNAL: 11 	// 127.0.0.1
		, IF_V6_INTERNAL: 21 	// fc00::
		, IF_V4_PUBLIC: 12
		, IF_V6_PUBLIC: 22
		, IF_V4_LOCAL: 13 		// §169.254.1.x to 169.254.254.y
		, IF_V6_LOCAL: 23 		// fe80::
		, IF_V4_ANY: 14
		, IF_V6_ANY: 24

		, PORT_ANY: -1 			// automagically lsiten on any port



		, init: function( options ){
			this.config = options.config;

			this.__parseInterfaceConfig();

			if ( this.config.port ) this.port = this.config.port;
		}



		, __parseInterfaceConfig: function(){
			var   networkInterfaces = os.networkInterfaces()
				, keys = Object.keys( networkInterfaces )
				, m = keys.length
				, interfaces = []
				, i = 0
				, k = 0
				, config, iface;

			this.interfaces = [];

			while( m-- ){
				networkInterfaces[ keys[ m ] ].forEach( function( iface ){
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
			else interfaces = [ this.IF_ANY ];
			

			i = interfaces.length;
			while( i-- ){
				k = this.interfaces.length;
				while( k-- ){
					config = interfaces[ i ];
					iface = this.interfaces[ k ];

					if ( config === iface.address.toLowerCase() ) 												iface.listen = true;
					else if ( iface.local )																		log.warn( "cannot listen on local interface [" + iface.address + "]. not supported!" ), iface.listen = false;

					else if ( config === this.IF_ANY ) 															iface.listen = true;
					else if ( config === this.IF_PUBLIC && iface.public ) 										iface.listen = true;
					else if ( config === this.IF_PRIVATE && iface.private ) 									iface.listen = true;
					else if ( config === this.IF_LOCAL && iface.local ) 										iface.listen = true;
					else if ( config === this.IF_INTERNAL && iface.internal )  									iface.listen = true;

					else if ( config === this.IF_V4_ANY && iface.family === "IPv4" ) 							iface.listen = true;
					else if ( config === this.IF_V4_PUBLIC && iface.family === "IPv4" && iface.public ) 		iface.listen = true;
					else if ( config === this.IF_V4_PRIVATE && iface.family === "IPv4" && iface.private ) 		iface.listen = true;
					else if ( config === this.IF_V4_LOCAL && iface.family === "IPv4" && iface.local ) 			iface.listen = true;
					else if ( config === this.IF_V4_INTERNAL && iface.family === "IPv4" && iface.internal ) 	iface.listen = true;
				
					else if ( config === this.IF_V6_ANY && iface.family === "IPv6" ) 							iface.listen = true;
					else if ( config === this.IF_V6_PUBLIC && iface.family === "IPv6" && iface.public ) 		iface.listen = true;
					else if ( config === this.IF_V6_PRIVATE && iface.family === "IPv6" && iface.private ) 		iface.listen = true;
					else if ( config === this.IF_V6_LOCAL && iface.family === "IPv6" && iface.local ) 			iface.listen = true;
					else if ( config === this.IF_V6_INTERNAL && iface.family === "IPv6" && iface.internal ) 	iface.listen = true;
				}
			}
		}
	} );