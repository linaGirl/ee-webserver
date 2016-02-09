

	var   Class 	= require('ee-class')
		, Events 	= require('ee-event-emitter')
		, log 		= require('ee-log')
		, Waiter 	= require('ee-waiter')
		, http 		= require('http');

	var   Server 	= require('./Server')
		, Request 	= require('./Request')
		, Response 	= require('./Response');




	module.exports = new Class( {
		  inherits: Server


		// create request / response, emit event
		, handleRequest: function(req, res){
			var   request 
				, response;

			request = new Request({
				request: req
			});
			
			response = new Response({
		 		  response: res
		 		, request: request
		 	});

			request.setResponse(response);

			this.emit('request', request, response);
		}


		, handleError: function(err) {
			log(err);
		}


		, listen: function(callback){
			var waiter = new Waiter();

			this.interfaces.forEach(function(iface){
				if (iface.listen) {
					waiter.add(function(cb) {
						var server = http.createServer();

						server.on('request', this.handleRequest.bind(this));		
						server.on('error', this.handleError.bind(this));				

						server.listen(this.port, iface.address, function(err) {
							if (err) this.emit('error', err );
							else {
								var info = server.address();
								if (!this.silent) log.info('HTTP Server listening on «'+info.address+'», port «'+info.port+'» ...');
							}

							this.servers.push(server);
							cb(err);
						}.bind(this));

					}.bind(this));	
				}
			}.bind(this));

			

			waiter.start(function(err) {
				if (typeof callback === 'function') callback(err);
			}.bind(this));
		}
	});