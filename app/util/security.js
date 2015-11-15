
/*!
* Module dependencies.
*/


var secrets = require('simple-secrets');
var master_key = new Buffer(common.config.master, 'hex');


exports.pack = function(data) {
	var sender = secrets(master_key);
	var packet = sender.pack(data);
	return packet;
}

exports.unpack = function(encrypted) {
	var sender = secrets(master_key);
	return sender.unpack(encrypted);
}
