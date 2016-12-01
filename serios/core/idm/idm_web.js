var express = require('express');
var path = require('path');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var logger = require('morgan');
var methodOverride = require('method-override');
var idmWeb = require('agile-idm-web-ui');

function init(settings) {    
    var https = require('https');
    var app = express();

    app.set('view engine', 'ejs');
    app.use(logger('dev'));
    app.use(cookieParser());
    
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    
    app.use(methodOverride());
    app.use(session({  secret: 'keyboard cat',
                       resave: false,
                       saveUninitialized: false
                    }));
    app.use(passport.initialize());
    app.use(passport.session());

    //set up external providers with passport
    idmWeb.serializer(settings.idm.webui, settings.idm.core);
    var strategies = idmWeb.authStrategies(settings.idm.webui, settings.idm.core);
    
    app.use("/auth", idmWeb.routerProviders(strategies));
    
    //set up static sites
    app.use("/static", express.static(path.join(__dirname, '../../../public/idm/static')));

    app.get("/", function(req,res){
        res.redirect("/static/index.html");
    });

    var oauth2 = idmWeb.oauth2orizeServer(settings.idm.webui, settings.idm.core);
    idmWeb.oauth2ServerStrategies(settings.idm.webui, settings.idm.core);
    app.use("/oauth2",idmWeb.routerOauth2(settings.idm.webui, settings.idm.core));
    app.use("/",idmWeb.routerSite(strategies));

    app.get('/account', ensureAuthenticated, function (req, res) {
        console.log(req.session.passport.user);
        res.send(req.session.passport.user);
    });

    return app;
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

module.exports = {
    init : init
};
