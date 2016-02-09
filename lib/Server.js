

	var   Class 	= require('ee-class')
		, Events 	= require('ee-event-emitter')
		, log 		= require('ee-log')
		, argv 		= require('ee-argv')
		, http 		= require('http')
		, os 		= require('os')
		, constants = require('./const')
		, Waiter 	= require('ee-waiter');


	var   debug		= argv.has('debug-webserver');


	module.exports = new Class( {
		inherits: Events

		// the servers configuration
		, config: {}
		, servers: []
		, interfaces: []
		, interfaceMap: {
			  public: []
			, private: []
			, internal: []
			, local: []
			, IPv4: []
			, IPv6: []
		}


		/*
		 * class constructor
		 *
		 * @param <Object> options
		 */
		, init: function(options) {
			this.config = options.config;

			this.silent = options && options.silent || argv.has('silent');

			this._parseInterfaceConfig();

			if (argv.has('port')) this.port = argv.get('port');
			else if (this.config.port) this.port = this.config.port;
		}

		

		/*
		 * the close method ends all server instances
		 *
		 * @param <Function> callback
		 */
		, close: function(callback) {
			if (this.servers.length) {
				var waiter = new Waiter();

				this.servers.forEach(function(server){
					waiter.add(function(cb){
						server.close(function(err){
							cb(err);
						});
					}.bind(this));
				}.bind(this));

				waiter.start(function(){
					log.info('HTTP Server was closed ...');
					if (callback) callback();
				}.bind(this));
			}
			else if (callback) callback();
		}



		/*
		 * the _parseInterfaceConfig parses the configuration for the server
		 */
		, _parseInterfaceConfig: function(){
			var   networkInterfaces = os.networkInterfaces()
				, keys = Object.keys(networkInterfaces)
				, m = keys.length
				, interfaces = []
				, enableListen;


			// collect a list of avialable interfaces, amke a map of them
			while (m--){
				networkInterfaces[keys[m]].forEach(function(iface) {
					var   isPublic 		= !/^(?:192\.168\.|10\.|172\.(?:1[6-9]|2[0-9]|3[0-1])\.|f[cd][0-9a-f]{2}:|fe[89ab]|169\.254\.(?:[1-9]|1[0-9]{1,2}|2[0-9]|2[0-4][0-9]|25[0-4])|127\.0\.0\.1|\:\:1)/gi.test(iface.address)
						, isPrivate 	= /^(?:192\.168\.|10\.|172\.(?:1[6-9]|2[0-9]|3[0-1])\.|f[cd][0-9a-f]{2}:)/gi.test(iface.address)
						, isLocal 		= /^(?:fe[89ab]|169\.254\.(?:[1-9]|1[0-9]{1,2}|2[0-9]|2[0-4][0-9]|25[0-4]))/gi.test(iface.address)
						, isInternal 	= iface.internal
						, isIPv4 		= iface.family === "IPv4"
						, isIPv6 		= iface.family === "IPv6"
						, definition;

					definition = {
						  public: 	isPublic
						, private: 	isPrivate
						, local: 	isLocal
						, internal: iface.internal
						, family: 	iface.family
						, IPv4: 	isIPv4
						, IPv6: 	isIPv6
						, address: 	iface.address
					};

					if (isPublic) 	this.interfaceMap.public.push(definition);
					if (isPrivate) 	this.interfaceMap.private.push(definition);
					if (isLocal) 	this.interfaceMap.local.push(definition);
					if (isInternal) this.interfaceMap.internal.push(definition);
					if (isIPv4) 	this.interfaceMap.IPv4.push(definition);
					if (isIPv6) 	this.interfaceMap.IPv6.push(definition);

					if (iface.address !== undefined) this.interfaceMap[iface.address] = definition;

					this.interfaces.push(definition);
				}.bind(this));
			}


			// get list of interfaces to use for this server
			if (this.config.interface) interfaces.push(this.config.interface);
			else if (this.config.interfaces) interfaces = this.config.interfaces;
			else interfaces = [constants.IF_ANY];


			// enable lsitening flagon a list of interfaces
			enableListen = function(interfaceList){
				 interfaceList.forEach(function(networkInterface) {
				 	if (!networkInterface.local) {
				 		networkInterface.listen = true;
				 	}
				 });
			}.bind(this)


			// find interfaces to listen on
			interfaces.forEach(function(interfaceSelection){ 
				switch (interfaceSelection) {
					case constants.IF_ANY: // listen on all interfaces
						enableListen(this.interfaces);
						break;

					case constants.IF_PUBLIC:
						enableListen(this.interfaceMap.public);
						break;

					case constants.IF_PRIVATE:
						enableListen(this.interfaceMap.private);
						break;

					case constants.IF_LOCAL:
						enableListen(this.interfaceMap.local);
						break;

					case constants.IF_INTERNAL:
						enableListen(this.interfaceMap.internal);
						break;

					case constants.IF_V4_ANY:
						enableListen(this.interfaces.filter(function(networkInterface){return networkInterface.IPv4;}));
						break;

					case constants.IF_V4_PUBLIC:
						enableListen(this.interfaceMap.public.filter(function(networkInterface){return networkInterface.IPv4;}));
						break;

					case constants.IF_V4_PRIVATE:
						enableListen(this.interfaceMap.private.filter(function(networkInterface){return networkInterface.IPv4;}));
						break;

					case constants.IF_V4_LOCAL:
						enableListen(this.interfaceMap.local.filter(function(networkInterface){return networkInterface.IPv4;}));
						break;

					case constants.IF_V4_INTERNAL:
						enableListen(this.interfaceMap.internal.filter(function(networkInterface){return networkInterface.IPv4;}));
						break;

					case constants.IF_V6_ANY:
						enableListen(this.interfaces.filter(function(networkInterface){return networkInterface.IPv6;}));
						break;

					case constants.IF_V6_PUBLIC:
						enableListen(this.interfaceMap.public.filter(function(networkInterface){return networkInterface.IPv6;}));
						break;

					case constants.IF_V6_PRIVATE:
						enableListen(this.interfaceMap.private.filter(function(networkInterface){return networkInterface.IPv6;}));
						break;

					case constants.IF_V6_LOCAL:
						enableListen(this.interfaceMap.local.filter(function(networkInterface){return networkInterface.IPv6;}));
						break;

					case constants.IF_V6_INTERNAL:
						enableListen(this.interfaceMap.internal.filter(function(networkInterface){return networkInterface.IPv6;}));
						break;

					default:
						if (this.interfaceMap[interfaceSelection]) enableListen([this.interfaceMap[interfaceSelection]]);
						else log.warn('Cannot lsiten on interface «'+interfaceSelection+'», either the ip is not present or the configuraiton options is invalid!');
				}
			}.bind(this));
		}
	} );