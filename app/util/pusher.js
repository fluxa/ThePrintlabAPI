
/*!
 * Module dependencies.
 */

var ua = require('urban-airship');
var _ua = null;

exports.init = function() {
	if (!_ua) {
		_ua = new ua(common.config.ua.key, common.config.ua.secret, common.config.ua.master);
		console.log('Initializing UrbanAirship');
	};
}


exports.send = function(payload, callback) {
	if (_ua) {
		_ua.pushNotification('/api/push', payload, callback);
	} else {
		callback('UrbanAirship not initialized');
	}
}
