var when = require('when');
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');

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

    app.get("/version", getVersion);

    // API for Gateways
    app.post("/gateway/:gatewayid", gateway.add);
    app.put("/gateway/:gatewayid", gateway.update);
    app.get("/gateway/:gatewayid", gateway.get);
    app.delete("/gateway/:gatewayid", gateway.remove);

    app.get("/gateway", gateway.getAllGatewaysForUser);

    // API for Service Objects
    app.post("/", serviceObject.add);
    app.put("/:soID", serviceObject.update);
    app.get("/:soID", serviceObject.get);
    app.delete("/:soID", serviceObject.remove);

    app.get("/SOs", serviceObject.getAllSoForUser);
    app.get("/:gateway/SOs", serviceObject.getAllSoForGateway);

    // API for Sensor Data
    app.put("/:soID/streams/:streamid", sensorData.add);
    app.get("/:soID/streams/:streamid/:options", sensorData.getAllData);
    app.delete("/:soID/streams/:streamid", sensorData.remove);
}

function getVersion(req, res) {
    res.json({version: API_VERSION});
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

    get settings() { return settings; }
};
