
/*!
* Module dependencies.
*/


var secrets = require('simple-secrets');
var master_key = new Buffer(require('../../config/config')[process.env.NODE_ENV].master, 'hex');


exports.pack = function(data) {
	var sender = secrets(master_key);
	var packet = sender.pack(data);
	return packet;
}	