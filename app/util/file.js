var fs = require('fs');
var path = require('path');
var util = require('util');

//HELPER METHODS

exports.readAtPath = function(filePath, success) {
	if(!filePath) {
		success('not file specified')
	}
	//var appPath = path.resolve(__dirname, '../..');
	//var logsPath = appPath + filePath;
	fs.readFile(filePath, function(err,data) {
		if(!err) {
			success(data.toString('utf8'));
		} else {
			success(util.format('error: cannot open file at: %s',filePath));
		}
	});
}