
/**
 * Module dependencies
 */
 
require('./proto');
var express = require('express')
var env = process.env.NODE_ENV || 'development'
var config = require('./config/config')[env]
var mongoose = require('mongoose')
var fs = require('fs')
var time = require('time')


require('express-namespace')

mongoose.connect(config.db)

// Bootstrap models
fs.readdirSync(__dirname + '/app/models').forEach(function (file) {
	if (~file.indexOf('.js')) require(__dirname + '/app/models/' + file)
})

var app = express()

// Bootstrap application settings
var express_config = require('./config/express')
express_config.setup(app, config)

// Bootstrap routes
require('./config/routes')(app, express_config.auth)

// Start the app by listening on <port>
var port = process.env.PORT || 5006
console.log("==== START ========================================");
app.listen(port, function() {
	console.log('{0} | Express app started on port {1}'.format(new time.Date().setTimezone('UTC'),port));
	console.log("=== LOGS ==========================================");
});

// Expose app
module.exports = app