var when = require('when');
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var pjson = require('../../package.json');

// API files for different data types
var serviceObject = require('./serviceobject');
var gateway = require("./gateway");
var sensorData = require("./sensordata");

var API_VERSION = 1;

var errorHandler = function (err, req, res, next) {
    console.log(err.stack);
    res.json(400, {error: "unexpected_error", message: err.toString()});
};

var app;
var settings;
var server;
var core;

function init(_server, _core) {
    server = _server;
    settings = _core.settings;
    core = _core;

    app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(errorHandler);

    var checkAuth = function(req, res, next) {
        // TODO: check whether ensured-login would be a better choice
        if(req.user) {
            next();
        } else {
            console.log("check bearer");
            passport.authenticate('agile-bearer', {session: false})(req, res, next);
        }
    };

    var checkAuthOrToken = function(req, res, next) {
        // TODO: as above - check correctness
        if(req.user) {
            next();
        } else {
            serviceObject.checkToken(req, res).then(function(hasToken) {
                if(hasToken)
                    next();
                else
                    passport.authenticate('agile-bearer', {session: false})(req, res, next);
            }, function(err) {
                res.status(403).end();
            });
        }
    }

    var checkPermission = function(req, res, next) {
        // TODO: check flow contorl permission on SO
        // TODO: Ensure that requests with access_token can always pass
        
        // default behaviour: accept
        next();
    }
    
    app.get("/api/version", getVersion);

    // API for Gateways - to be tested!
    app.post("/api/gateway", gateway.add);
    app.put("/api/gateway/:gatewayID", gateway.update);
    app.get("/api/gateway/:gatewayID", gateway.get);
    app.delete("/api/gateway/:gatewayID", gateway.remove);
    app.get("/api/gateway", gateway.getAllGatewaysForUser);
    app.get("/api/gateway/:gateway/sos", serviceObject.getAllSoForGateway);

    // API for Service Objects - tested
    app.post("/api/", checkAuth, serviceObject.add);
    app.put("/api/:soID", checkAuth, serviceObject.update);
    app.get("/api/:soID", checkAuth, serviceObject.get);
    app.delete("/api/:soID", checkAuth, serviceObject.remove);
    app.get("/api/", checkAuth, serviceObject.getAllSoForUser);

    // API for Sensor Data
    app.put("/api/:soID/streams/:streamID", checkAuthOrToken, sensorData.add);
    app.get("/api/:soID/streams/:streamID/:options", checkAuthOrToken, checkPermission, sensorData.getDataForStream);

    // TODO Phil 18/11/16: maybe add getting sensor data for gateway
    app.get("/api/data/:options", sensorData.getDataForUser);
    app.delete("/api/:soID/streams/:streamID", sensorData.remove);

    core.app.use(app);
}

function getVersion(req, res) {
    res.json({version: pjson.version});
}

function start() {
    return when.resolve();
}

function stop() {
    return when.resolve();
}

module.exports = {
    init: init,
    start : start,
    stop : stop,

    get settings() { return settings; },
    get server() { return server; }
};
