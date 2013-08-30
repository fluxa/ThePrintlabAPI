var fs = require('fs');
var path = require('path');

//HELPER METHODS

exports.readFileAtPath = function(filePath, success) {
	if(!filePath) {
		success('not file specified')
	}
	//var appPath = path.resolve(__dirname, '../..');
	//var logsPath = appPath + filePath;
	fs.readFile(filePath, function(err,data) {
		if(!err) {
			success(data.toString('utf8'));
		} else {
			success('error: cannot open file at: {0}'.format(filePath));
		}
	});
}