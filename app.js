
/**
 * Module dependencies
 */

require('newrelic');
console.log("==== STARTING SERVER ========================================");
var common = require('./app/util/common');
var express = require('express');
var mongoose = require('mongoose');
var http = require('http');
var models = require('./app/models');


// http://reviewsignal.com/blog/2013/11/13/benchmarking-asyncronous-php-vs-nodejs-properly/
http.globalAgent.maxSockets = Infinity;

require('express-namespace');

var app = express();

models.init(function() {
	// Bootstrap application settings
	require('./config/express')(app);

	// Bootstrap routes
	require('./config/routes')(app);

	// Init Push Notification
	require('./app/util/pusher').init();

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
	require('./app/util/cron').schedule();
});
