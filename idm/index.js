var idmWeb = require("agile-idm-web-ui");
var express = require('express');
var passport = require('passport');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var session = require('express-session');
var path = require('path');
var request = require('request');

var apiTokenStrategy = require('./strategies').apiTokenStrategy;
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

    try {
        passport.use("serios-api_token", apiTokenStrategy);
    } catch(err) {
        console.log("Unable to register api_token strategy");
    }

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

function createSignUpFunction(settings) {
    return function(org_req, org_res, next) {
        console.log("##############################################");
        var host = settings.server.host;
        var port = settings.server.port;
        var client = settings.oauth2.clientID;
        var secret = settings.oauth2.clientSecret;
        var protocol = settings.server.tls ? "https" : "http";
        
        var auth = "Basic " + new Buffer(client + ":" + secret).toString("base64");
        request(
            {
                method : "POST",
                url : protocol+"://"+host+":"+port+"/oauth2/token",
                form: {
                    grant_type:'client_credentials'
                },
                headers : {
                    "Authorization" : auth
                }
            },
            function (error, response, body) {
                if(error)
                    throw new Error(error);
                var result = JSON.parse(body);
                var token = result.access_token;
                var type  = result.token_type;
                console.log("kind of token obtained: "+type);
                console.log("token obtained: "+token);
                var user = org_req.user;
 	            /* var user = {
                    "auth_type": "agile-local",
                    "user_name": "mallory",
                    "password" : "secret",
                    "role": "non-admin" //can be removed...
                };*/
	            var options = {
                    url:  protocol+"://"+host+":"+port+ '/api/v1/user/',
                    body: JSON.stringify(user),
                    headers: {
                        'Authorization': 'bearer ' + token,
                        'User-Agent': 'user-agent',
                        'Content-type': 'application/json'
                    }
                };
                request.post(options, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        try {
                            var result = JSON.parse(body);
	                        console.log("user created"+body);
                            org_res.status(200).json(result);
                        } catch (error) {
                            console.log("error"+error);
                        }
                    } else if (!error) {
                        console.log( "unexpected status code from IDM  endpoint :" + response.statusCode + "response:" + response.body);
                        org_res.status(response.statusCode).send(response.body).end();
                    } else {
                        console.log("unexpected result from IDM  endpoint " + error);
                        org_res.status(500).end();
                    }
                });
                
            });
    }
}

module.exports = {
    init : init
};
