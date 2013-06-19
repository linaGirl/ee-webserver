

	var Webserver 	= require( "./" )
		, assert 	= require( "assert" );



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