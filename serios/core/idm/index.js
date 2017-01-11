var idmWeb = require("agile-idm-web-ui");
var express = require('express');
var passport = require('passport');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var session = require('express-session');
var path = require('path');

var errorHandler = require('./errorHandler');

function init(settings) {

    var app = express();
    
    app.set('view engine', 'ejs');
    app.use(logger('dev'));
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

    //set serializer for users and clients
    idmWeb.serializer(settings.idm.ui, settings.idm.core);
    
    //set up external providers with passport
    var strategies = idmWeb.authStrategies(settings.idm.ui, settings.idm.core);

    //set ahentication endpoints to authenticate with different means (webid, oauth2, etc)
    app.use("/idm/auth", idmWeb.routerProviders(strategies));

    //set up entities API
    app.use("/idm/api/v1", idmWeb.routerApi(settings.idm.core, strategies));

    //set up static sites
    app.use("/idm/static", express.static(path.join(__dirname, './static')));

    //oauth2orize server (this allows IDM to work as an Oauth2 provider to apps)
    var oauth2 = idmWeb.oauth2orizeServer(settings.idm.ui, settings.idm.core);
    idmWeb.oauth2ServerStrategies(settings.idm.ui, settings.idm.core);
    app.use("/idm/oauth2",idmWeb.routerOauth2(settings.idm.ui, settings.idm.core));
    app.use("/idm/",idmWeb.routerSite(strategies));
    app.use(errorHandler);

    return app;
}

module.exports = {
    init : init
};
