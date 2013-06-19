# ee-webserver

a simple webserver which can listen on specific interfaces with a high level request an response class. currently vonly very basic stuff works. the server does currently only support non secure connections ( no https ).



	var Webserver 	= require( "./" );


	new Webserver( {
		http: {
			  interface: 	Webserver.IF_INTERNAL
			, port:  		12001
		}
		, on: {
			request: function( request, response ){
				response.send( "hi ;)" );
			}
		}
	} ).listen();

	// the sevrer listens now on 127.0.0.1 and [::1]


the available interface options are:

	Webserver.IF_PUBLIC			// listen on all public interfaces
	Webserver.IF_PRIVATE		// listen on all private interfaces ( RFC 1918, 192.168.x.y, 10.x.y.z, 172.16.x.y - 172.31.x.y, fc00:: )
	Webserver.IF_INTERNAL 		// listen on localhost ( 127.0.0.1, ::1, fe80::/7 )
	// Webserver.IF_LOCAL 		// listen on link local 169.254.1.x to 169.254.254.y, fe80::/10   <<-- not supported
	Webserver.IF_ANY			// listen on any interface
	Webserver.IF_V4_PRIVATE		// listen on private v4 interfaces
	Webserver.IF_V6_PRIVATE 	// listen on private v6 interfaces
	Webserver.IF_V4_INTERNAL 	// listen on 127.0.0.1
	Webserver.IF_V6_INTERNAL 	// listen on fc00::/7, ::1
	Webserver.IF_V4_PUBLIC
	Webserver.IF_V6_PUBLIC
	// Webserver.IF_V4_LOCAL 	// listen on 169.254.1.x to 169.254.254.y    <<-- not supported
	// Webserver.IF_V6_LOCAL 	// listen on fe80::/10    <<-- not supported
	Webserver.IF_V4_ANY
	Webserver.IF_V6_ANY


the send method on the response class accepts the following parameters
	
	response.send( [ data ], [ statusCode ], [ headers ] );