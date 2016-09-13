var express = require('express');
var path = require('path');
var passport = require('passport');
var fs = require('fs');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var logger = require('morgan');
var methodOverride = require('method-override');
var idmWeb = require('agile-idm-web-ui');

function init(settings) {    
    var RouterProviers = idmWeb.RouterProviers;
    var RouterApi = idmWeb.RouterApi;

    var https = require('https');
    var app = express();

    app.use(logger('dev'));
    app.use(cookieParser());
    
    app.use(bodyParser.json());
    
    app.use(methodOverride());
    app.use(session({  secret: 'keyboard cat',
                       resave: false,
                       saveUninitialized: false
                    }));
    app.use(passport.initialize());
    app.use(passport.session());

    //set up external providers with passport
    idmWeb.serializer(settings.idm);
    idmWeb.authStrategies(settings.idm);
    
    var providersRouter = new RouterProviers(settings.idm, app);
    app.use("/auth",providersRouter);

    //set up authentication API
    idmWeb.apiStrategies(settings.idm);
    var apiRouter = new RouterApi(app);
    app.use("/api",apiRouter);
    
    //set up static sites
    app.use("/static", express.static(path.join(__dirname, '../../../public/idm/static')));

    //NOTE this demo registers a sensor based on the request coming
    // from the browser (authenticating through cookies with passport)
    //also this example uses idm-core for the registration
    /* var Demo = require('./demo');
    d = new Demo(app);*/

    app.get("/", function(req,res){
        res.redirect("/static/index.html");
    });

    // test authentication
    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        res.redirect('/');
    }

    return app;
}


function auth(req, res) {
    res.json({ msg : "Lets authenticate" });
}

module.exports = {
    init : init
};
