!function(){

	var Class = require('ee-class')
		, instance;
	
	var Constants = new Class({
		  IF_PUBLIC: 1			// listen on all public interfaces
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


		, mapTo: function(target) {
			Object.keys(this).forEach(function(key){
				target[key] = this[key];
			}.bind(this));
		}
	});

	instance = new Constants();

	Object.freeze(instance);

	module.exports = instance;


}();
