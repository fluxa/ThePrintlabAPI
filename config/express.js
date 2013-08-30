
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
	app.use(express.favicon())

	app.use(express.static(config.root + '/public'))
	app.use(express.logger('dev'))

	// views config
	app.set('views', config.root + '/app/views')
	app.set('view engine', 'jade')


	app.configure(function () {
		// bodyParser should be above methodOverride
		app.use(express.bodyParser())
		app.use(express.methodOverride())

		app.use(lessMiddleware({
			dest: __dirname + '/public',
			src: __dirname + '/src/less',
			prefix: '/stylesheets',
			compress : true,
			debug: false
		}));

		// cookieParser should be above session
		app.use(express.cookieParser())
		app.use(express.session({
			secret: pkg.name,
			store: new mongoStore({
				url: config.db,
				collection : 'sessions'
			})
		}))


		// expose pkg and node env to views
		app.use(function (req, res, next) {
			res.locals.pkg = pkg
			res.locals.env = env
			next()
		})

		// View helpers
		app.use(helpers(pkg.name))

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
