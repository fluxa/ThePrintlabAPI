'use strict';

// Dependencies
const common = require('./app/util/common');
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const compress = require('compression');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const morgan = require('morgan');
const cron = require('./app/util/cron');
const flash = require('connect-flash');
const app = express();
const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const pkg = require('./package.json');
const env = process.env.NODE_ENV || 'development';
const lessMiddleware = require('less-middleware');
const http = require('http');
const models = require('./app/models');
const cors = require('cors');

// http://reviewsignal.com/blog/2013/11/13/benchmarking-asyncronous-php-vs-nodejs-properly/
http.globalAgent.maxSockets = Infinity;

models.init(function () {

    // Bootstrap routes
    require('./config/routes')(app);

    // Init Push Notification
    // require('./app/util/pusher').init();


    app.use(morgan('combined'));

    // Configuration
    app.enable('trust proxy');
    app.set('port', process.env.PORT || 5006);
    app.set('views', __dirname + '/app/views');
    app.set('view engine', 'jade');

    // expose pkg and node env to views
    app.use(function (req, res, next) {
        res.locals.pkg = pkg;
        res.locals.env = env;
        res.locals.session = req.session;
        res.locals.moment = require('moment');
        res.locals.config = common.config;
        // res.locals.flash = req.flash.bind(req);

        console.log(res.locals.pkg);
        next();
    });

// admin auth
    passport.use(new BasicStrategy(function (user, pass, done) {
        if (user === common.config.auth.user && pass === common.config.auth.pass) {
            done(null, {user: user});
        } else {
            done(null, false);
        }
    }));

    app.use(compress());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json({limit: '128kb'}));
// less
    app.use(lessMiddleware(
        __dirname + '/app/src/less',
        {
            dest: __dirname + '/public',
            prefix: '/stylesheets',
            compress: true,
            debug: true,
            force: common.config.less_force_compile
        }
    ));
    app.use(express.static('public'));
    app.use(methodOverride());
    app.use(flash());

    app.locals.moment = require('moment-timezone');
    app.locals.moment.locale('es');
    app.locals.moment.tz.setDefault('America/Santiago');
    app.locals.numeral = require('numeral');
    app.locals.numeral.register('locale', 'cl', {
        delimiters: {
            thousands: '.',
            decimal: ','
        },
        currency: {
            symbol: '$'
        }
    });
    app.locals.numeral.locale('cl');

    app.use(session({
        secret: common.config.master,
        store: new MongoStore({
            url: common.config.db,
            collection: 'sessions',
            autoReconnect: true
        }),
        resave: true,
        saveUninitialized: true,
        cookie: {
            maxAge: 2592000000
        }
    }));

    app.use(passport.initialize());

    // CORS cross-domain
    var whitelist = ['http://www.theprintlab.cl', 'http://theprintlab.cl', 'https://secure.theprintlab.cl', 'http://api.theprintlab.cl', 'http://api-dev.theprintlab.cl', 'http://192.168.1.7:5009'];
    var cors_options = {
        origin: function (origin, callback) {
            var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
            callback(null, originIsWhitelisted);
        },
        methods: ['GET', 'PUT', 'POST', 'DELETE'],
        allowedHeaders: 'Content-Type'

    };
    app.use(cors(cors_options));


    // Start the app by listening on <port>
    app.listen(app.get('port'), function () {
        console.log("http.globalAgent.maxSockets => " + http.globalAgent.maxSockets);
        console.log(common.util.format('%s | Express app started on port %d', common.moment.utc(), app.get('port')));
        console.log("=== LOGS ==========================================");
    });

    // Expose app
    module.exports = app;

    // Cronjobs
    require('./app/util/cron').schedule();
});
