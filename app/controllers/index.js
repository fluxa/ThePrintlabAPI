
/*!
 * Module dependencies
 */

var help = require('../../help');


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
	help.readFileAtPath('/home/git/apps/api.theprintlab-{0}/shared/log/{1}.out.log'.format(env,env), function(logs) {
		data['stdout'] = logs;

		help.readFileAtPath('/home/git/apps/api.theprintlab-{0}/shared/log/{1}.err.log'.format(env,env), function(logs) {
			data['stderr'] = logs;
			res.send({logs:data});
		});
	});
}