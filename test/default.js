	
	var   Class 		= require('ee-class')
		, log 			= require('ee-log')
		, assert 		= require('assert')
		, travis 		= require('ee-travis');



	var   request 		= require('request')
		, Webserver 	= require('../.')
		, crypto 		= require('crypto');


	var md5 = function(buf){
		return crypto.createHash('md5').update(buf).digest('hex');
	}


	var config = {
		  port: 13023
		, interface: Webserver.IF_ANY
	};




	describe('The Webserver', function(){

		it('should be able to open a port', function(done){
			var server = new Webserver(config);

			server.listen(function(err){ log.trace(err);
				if (err) done(err);
				else {
					server.on('request', function(request, response){
						request.abort();
						server.close(done);
					}.bind(this));

					var  r = request.get('http://127.0.0.1:13023/');
				}
			});
		});
	});
	