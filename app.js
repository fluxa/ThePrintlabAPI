
/**
 * Module dependencies
 */

require('newrelic')
console.log("==== STARTING SERVER ========================================");
var common = require('./app/util/common');
var express = require('express');
var mongoose = require('mongoose');
var fs = require('fs');
var http = require('http');
var cron = require('./app/util/cron');

// http://reviewsignal.com/blog/2013/11/13/benchmarking-asyncronous-php-vs-nodejs-properly/
http.globalAgent.maxSockets = Infinity;

require('express-namespace');

mongoose.connect(common.config.db);

mongoose.connection.on('connected', function () {
	console.log('Mongoose default connection open to ' + common.config.db);
});

mongoose.connection.on('error',function (err) {
	console.log('Mongoose default connection error: ' + err);
});

mongoose.connection.on('disconnected', function () {
	console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
	mongoose.connection.close(function () {
		console.log('Mongoose default connection disconnected through app termination');
		process.exit(0);
	});
});


// Bootstrap models
fs.readdirSync(__dirname + '/app/models').forEach(function (file) {
	if (~file.indexOf('.js')) require(__dirname + '/app/models/' + file)
})

var app = express();

// Bootstrap application settings
require('./config/express')(app);

// Bootstrap routes
require('./config/routes')(app);

// Start the app by listening on <port>
var port = process.env.PORT || 5006
app.listen(port, function() {
	console.log("http.globalAgent.maxSockets => " + http.globalAgent.maxSockets);
	console.log(common.util.format('%s | Express app started on port %d', common.moment.utc(),port));
	console.log("=== LOGS ==========================================");
});

// Expose app
module.exports = app

// Cronjobs
cron.schedule();
