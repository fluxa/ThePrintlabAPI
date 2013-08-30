var conf = require('../conf');
var dbman = require('../dbman');
var help = require('../help');

//NavMenu
var navItems = [
	{title:'Dashboard',href:'/'}, 
	{title:'Clients',href:'clients'}, 
	{title:'Orders',href:'orders'},
	{title:'Logs',href:'logs'}
];

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
