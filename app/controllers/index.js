
/*!
 * Module dependencies
 */

var file = require('../util/file');

/* 
* Routes
*/

exports.admin = function(req, res){
	res.redirect('/admin/dashboard')
};

exports.blitz = function(req, res) {
	res.send('42');
}

exports.ping = function(req, res) {

	var is_allowed = false;
	var user_agent = req.headers['user-agent'];
	
	common._.each(common.config.allowed_ios_user_agents, function(ios_user_agent){
		if(user_agent.indexOf(ios_user_agent) > -1) {
			is_allowed = true;
		}
	});

	if(is_allowed) {
		res.send('OK');
	} else {

		// res.send(403, {
		// 	error: common.plerr.c.CustomError,
		// 	verbose: 'New version available on the App Store',
		// 	title: 'THIS IS A CUSTOM ERROR',
		// 	message: 'SO GO FUCK YOURSELF',
		// 	url: 'http://google.com'
		// });

		res.send(403, {
			error: common.plerr.c.OldAppVersion,
			verbose: 'New version available on the App Store',
			url: 'https://itunes.apple.com/cl/app/printlab-imprime-fotos-desde/id670160214?mt=8&uo=4'
		});
		
	}	
}

exports.logs = function(req, res) {
	var data = {};
	file.readAtPath(common.config.std.out, function(logs) {
		data['stdout'] = logs;

		file.readAtPath(common.config.std.err, function(logs) {
			data['stderr'] = logs;
			res.send({logs:data});
		});
	});
}