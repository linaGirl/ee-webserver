

	var Webserver 	= require( "./" )
		, assert 	= require( "assert" );



	new Webserver( {
		http: {
			  interface: 	Webserver.IF_ANY
			, port:  		12001
		}
		, on: {
			request: function( request, response ){
				response.send( null, { location: "/" }, 302 );
			}
		}
	} ).listen();