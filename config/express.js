
/*!
 * Module dependencies.
 */

var express = require('express')
var mongoStore = require('connect-mongo')(express)
var helpers = require('view-helpers')
var pkg = require('../package')
var env = process.env.NODE_ENV || 'development'
var lessMiddleware = require('less-middleware');

var auth = express.basicAuth(function(user, pass) {
	return user === 'theprintlab' && pass === 'theprintlabCL2013';
});

/*!
 * Expose
 */

exports.auth = auth;

exports.setup = function (app, config) {
	
	app.set('showStackError', true)

	// use express favicon
	app.use(express.favicon(__dirname + '/../public/img/favicon.ico'))

	app.use(express.logger('dev'))

	// views config
	app.set('views', config.root + '/app/views')
	app.set('view engine', 'jade')


	app.configure(function () {
		// bodyParser should be above methodOverride
		app.use(express.bodyParser())
		app.use(express.methodOverride())

		app.use(lessMiddleware({
			dest: __dirname + '/../public',
			src: __dirname + '/../src/less',
			prefix: '/stylesheets',
			compress : true,
			debug: false
		}));

		app.use(express.static(config.root + '/public'))

		// cookieParser should be above session
		app.use(express.cookieParser())

		// expose pkg and node env to views
		app.use(function (req, res, next) {
			res.locals.pkg = pkg
			res.locals.env = env
			next()
		})

		// View helpers
		app.use(helpers(pkg.name))

		// CORS cross-domain
		app.use(function(req, res, next) {
			res.header('Access-Control-Allow-Origin', 'https://secure.theprintlab.cl');
    		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    		res.header('Access-Control-Allow-Headers', 'Content-Type');
    		next();
		});

		// routes should be at the last
		app.use(app.router)

	})

	// development specific stuff
	app.configure('development', function () {
		app.locals.pretty = true;
	})

	// test specific stuff
	app.configure('test', function () {
		app.locals.pretty = true;
	})
}
