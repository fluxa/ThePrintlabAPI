
/*!
 * Module dependencies.
 */

var express = require('express');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
var passport = require('passport');
var cookieParser = require('cookie-parser');
var BasicStrategy = require('passport-http').BasicStrategy;
var helpers = require('view-helpers');
var pkg = require('../package');
var env = process.env.NODE_ENV || 'development';
var lessMiddleware = require('less-middleware');
var flash = require('connect-flash');
var log4js = require('log4js');
var cors = require('cors');
var path = require('path');

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


module.exports = function (app) {

	app.set('showStackError', true);

	//  logger
	app.use(log4js.connectLogger(logger, { level: 'auto' }));

	// use express favicon
  app.use(favicon(common.config.root + '/public/img/favicon.ico'));

	// views config
	app.set('views', common.config.root + '/app/views');
	app.set('view engine', 'jade');
	app.use(bodyParser());
	app.locals.pretty = true;

  // admin auth
	passport.use(new BasicStrategy(function(user, pass, done) {
		if(user === common.config.auth.user && pass === common.config.auth.pass) {
			done(null, {user: user});
		} else {
			done(null, false);
		}
	}));

  // cookieParser should be above session
	app.use(cookieParser());

	// express/mongo session storage
	app.use(session({
		secret: common.config.master,
		store: new mongoStore({
			url: common.config.db,
			collection : 'sessions',
			auto_reconnect: true
		})
	}));

  app.use(passport.initialize());

  // less
	app.use(lessMiddleware(
		path.join(common.config.root,'/app/src/less'),
		{
			dest: path.join(common.config.root,'/public'),
			prefix: '/stylesheets',
			compress : true,
			debug: false,
			force: true
		}
	));

	//static should be after less-middleware
	app.use(express.static(common.config.root + '/public'))


	// CORS cross-domain
  var whitelist = ['https://secure.theprintlab.cl', 'http://api.theprintlab.cl', 'http://api-dev.theprintlab.cl', 'http://192.168.1.7:5009'];
  var cors_options = {
    origin: function(origin, callback){
      var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
      callback(null, originIsWhitelisted);
    },
    methods:['GET', 'PUT', 'POST', 'DELETE'],
    allowedHeaders: 'Content-Type'

  };
  app.use(cors(cors_options));

	// flash
	app.use(flash());

	// expose pkg and node env to views
	// expose pkg and node env to views
	app.use(function (req, res, next) {
		res.locals.pkg = pkg;
		res.locals.env = env;
		res.locals.session = req.session;
		res.locals.moment = require('moment');
		next();
	});

	// View helpers
	app.use(helpers(pkg.name));

}
