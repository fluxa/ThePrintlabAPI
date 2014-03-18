
/**
 * Module dependencies
 */
 
require('newrelic')
console.log("==== STARTING SERVER ========================================");
var common = require('./app/util/common');
var express = require('express');
var mongoose = require('mongoose');
var fs = require('fs');
var time = require('time');
var http = require('http');
var cron = require('./app/util/cron');
var robot = require('./app/util/robot');

// http://reviewsignal.com/blog/2013/11/13/benchmarking-asyncronous-php-vs-nodejs-properly/
http.globalAgent.maxSockets = Infinity;

require('express-namespace')

mongoose.connect(common.config.db)

// Bootstrap models
fs.readdirSync(__dirname + '/app/models').forEach(function (file) {
	if (~file.indexOf('.js')) require(__dirname + '/app/models/' + file)
})

var app = express()

// Bootstrap application settings
var express_config = require('./config/express')
express_config.setup(app, common.config)

// Bootstrap routes
require('./config/routes')(app, express_config.auth)

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

// Start robots
//robot.start();