
/*!
 * Module dependencies.
 */

var express = require('express');
var mongoStore = require('connect-mongo')(express);
var helpers = require('view-helpers');
var pkg = require('../package');
var env = process.env.NODE_ENV || 'development';
var lessMiddleware = require('less-middleware');
var flash = require('connect-flash');
var log4js = require('log4js');

var auth = express.basicAuth(function(user, pass) {
	return user === 'theprintlab' && pass === 'theprintlabCL2013';
});

// Logging setup
log4js.configure({
	appenders: [
		{ type: 'console' }
  	],
  	replaceConsole: true
});
var logger = log4js.getLogger();

/*!
 * Expose
 */

exports.auth = auth;

exports.setup = function (app, config) {
	
	app.set('showStackError', true)

	//  logger
	app.use(log4js.connectLogger(logger, { level: 'auto' }));


	// use express favicon
	app.use(express.favicon(__dirname + '/../public/img/favicon.ico'));

	// views config
	app.set('views', config.root + '/app/views');
	app.set('view engine', 'jade');


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

		app.use(express.static(config.root + '/public'));

		// cookieParser should be above session
		app.use(express.cookieParser());

		// express/mongo session storage
		app.use(express.session({
			secret: config.master,
			store: new mongoStore({
				url: config.db,
				collection : 'sessions'
			})
		}));

	
		// CORS cross-domain
		app.use(function(req, res, next) {
			res.header('Access-Control-Allow-Origin', 'https://secure.theprintlab.cl');
    		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    		res.header('Access-Control-Allow-Headers', 'Content-Type');
    		next();
		});

		// flash
		app.use(flash());
		
		// expose pkg and node env to views
		// expose pkg and node env to views
		app.use(function (req, res, next) {
			res.locals.pkg = pkg;
			res.locals.env = env;
			res.locals.session = req.session;
			res.locals.moment = require('moment'),
			res.locals.msg_errors = req.flash('errors');
			res.locals.msg_info = req.flash('info');
			res.locals.msg_success = req.flash('success');
			res.locals.msg_warning = req.flash('warning');
			next()
		});
		
		// View helpers
		app.use(helpers(pkg.name));

		// routes should be at the last
		app.use(app.router);

	})

	// development specific stuff
	app.configure('development', function () {
		app.locals.pretty = true;
	})

}
