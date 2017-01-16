var express = require('express');
var path = require('path');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var logger = require('morgan');
var methodOverride = require('method-override');
var login = require('connect-ensure-login');
var tokens = require('./db/tokens');

var app;
var settings;
var server;
var core;

function init(_server, _core) {
    server = _server;
    settings = _core.settings;
    core = _core;

    app = express();

    app.set('view engine', 'ejs');
    app.use(cookieParser());
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(methodOverride());
    app.use(session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    
    require('./passport/serializer');
    require('./passport/strategy')(settings.oauth2);
    
    app.use("/", require('./routes/')(settings.oauth2, settings.ui.idm));
    
    //static content such as css, images, etc.
    app.use("/static", express.static(path.join(__dirname, '../../static')));

    core.app.use(app);
}

module.exports = {
    init : init
};
