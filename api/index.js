var when = require('when');
var express = require('express');
var bodyParser = require('body-parser');
var w = require('winston');
w.level = process.env.LOG_LEVEL;

var pjson = require('../package.json');

var API_VERSION = 2;

var errorHandler = function (err, req, res, next) {
    console.log(err.stack);
    res.json(400, {error: "unexpected_error", message: err.toString()});
};

function init(settings, checker, tag) {
    settings = settings;

    // API files for different data types
    try {
        var serviceObject = require('./serviceobject')(checker, tag);
        var gateway = require("./gateway");
        var sensorData = require("./sensordata");
    } catch(e) {
        w.error(e);
        process.exit();
    }

    var app = express();
    
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(errorHandler);

    app.get("/api/version", function(req, res, next) { console.log("req.user: ", req.user); next(); }, getVersion);

    // API for Gateways - to be tested!
    app.post("/gateway", gateway.add);
    app.put("/gateway/:gatewayID", gateway.update);
    app.get("/gateway/:gatewayID", gateway.get);
    app.delete("/gateway/:gatewayID", gateway.remove);
    app.get("/gateway", gateway.getAllGatewaysForUser);
    app.get("/gateway/:gateway/sos", serviceObject.getAllSoForGateway);

    // API for Service Objects - tested
    app.post("/", checker.checkAuth, serviceObject.add);
    app.put("/:soID", checker.checkAuth, serviceObject.update);
    app.get("/:soID", checker.checkAuth, serviceObject.get);
    app.delete("/:soID", checker.checkAuth, serviceObject.remove);
    app.get("/", checker.checkAuth, serviceObject.getAllSoForUser);

    // API for Sensor Data
    app.put("/:soID/streams/:streamID", checker.checkAuthOrToken, sensorData.add);
    app.get("/:soID/streams/:streamID/:options", checker.checkAuthOrToken, sensorData.getDataForStream);
    // TODO Phil 18/11/16: maybe add getting sensor data for gateway
    app.get("/data/:options", sensorData.getDataForUser);
    app.delete("/:soID/streams/:streamID", sensorData.remove);

    return Promise.resolve(app);
}

function valid(o) {
    return (o !== undefined) && (o !== null);
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
