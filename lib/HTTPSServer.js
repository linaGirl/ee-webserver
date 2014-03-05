

	var   Class 	= require('ee-class')
		, Events 	= require('ee-event-emitter')
		, log 		= require('ee-log');

	var   http 		= require('http');

	var   Server 	= require('./Server');



	module.exports = new Class( {
		inherits: Server


		, listen: function( callback ){
			throw new Error('https is not supported yet!');
		}
	} );