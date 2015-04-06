

	var   Class 		= require('ee-class')
		, Events 		= require('ee-event-emitter')
		, log 			= require('ee-log')
		, Waiter 		= require('ee-waiter')
		, project 		= require('ee-project');

	var   HTTPServer 	= require('./HTTPServer')
		, HTTPSServer 	= require('./HTTPSServer')
		, constants 	= require('./const');



	module.exports = new Class({
		inherits: Events

		// the servers configuration
		, config: {}


		/*
		 * class constructor
		 *
		 * @param <Object> options
		 */
		, init: function(options){

			// load server configuration
			this._parseConfig(options);


			// load the http server if required
			if (this.config.http) {
				this.http = new HTTPServer({ 
					config: this.config.http
					, on: {
						request: this._handleRequest.bind(this)
					}
				} );
			}

			// load the https server if required
			if (this.config.https) {
				this.https = new HTTPSServer({ 
					config: this.config.https
					, on: {
						request: this._handleRequest.bind(this)
					}
				});
			}
		}



		/*
		 * the _handleRequest method proxies the request event from 
		 * the servers to the listeners on this class
		 *
		 * @param <Object> request
		 * @param <Object> response
		 */
		, _handleRequest: function(request, response) {
			this.emit('request', request, response);
		}



		/*
		 * the close method closes the servers
		 *
		 * @param <function> callback
		 */
		, close: function(callback) {
			var waiter = new Waiter();

			if (this.http) {
				waiter.add(function(cb) {
					this.http.close(cb); 
				}.bind(this));
			}

			if (this.https) {
				waiter.add(function(cb) {
					this.https.close(cb);
				}.bind(this));
			}

			waiter.start(function() {
				this.emit('closed');
				if (typeof callback === "function") callback();
			}.bind(this ));
		}


		/*
		 * the listen method starts the servers
		 *
		 * @param <function> callback
		 */
		, listen: function( callback ) {
			var waiter = new Waiter();

			if (this.http) {
				waiter.add(function(cb) {
					this.http.listen(cb); 
				}.bind(this));
			}

			if (this.https) {
				waiter.add(function(cb) {
					this.https.listen(cb);
				}.bind(this));
			}

			waiter.start(function() {
				this.emit('listening');
				if (typeof callback === "function") callback();
			}.bind(this ));
		}


		/*
		 * the _parseConfig method loads the config from the options
		 * parameter or from the config.js file in the projects root directory
		 *
		 * @param <Obejct> configuration options
		 */
		, _parseConfig: function(options){

			// get http config from options, config
			if (options.http) this.config.http = options.http;
			else if (options.https) this.config.https = options.https;
			else this.config.http = options;
		}
	} );


	module.exports.constants = constants;
	constants.mapTo(module.exports);

    module.exports.testing = require('./testing');
    module.exports.Request = require('./Request');
    module.exports.Response = require('./Response');