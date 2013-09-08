
/*!
 * Module dependencies
 */

var help = require('../../help');
var config = require('../../config/config')


/* 
* Routes
*/

exports.index = function(req, res){
	res.render('index');
};

exports.partial = function (req, res) {
	var name = req.params.name;
	res.render('partials/' + name);
};

exports.blitz = function(req, res) {
	res.send('42');
}

exports.ping = function(req, res) {
	res.send('OK');
}

exports.logs = function(req, res) {
	var data = {};
	var env = process.env.NODE_ENV;
	help.readFileAtPath(config[env].std.out, function(logs) {
		data['stdout'] = logs;

		help.readFileAtPath(config[env].std.err, function(logs) {
			data['stderr'] = logs;
			res.send({logs:data});
		});
	});
}