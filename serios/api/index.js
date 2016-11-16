var when = require('when');
var express = require('express');
var bodyParser = require('body-parser');

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

function testIdm(req, res) {

    if(req.user === undefined || req.user === undefined) {
        res.status(403).json({ msg: "User not authenticated or cookies disabled." });
        return Promise.reject();
    }
    
    var token = req.user.token;
    var action = "create";
    var entity_type = "/Sensor";
    var entity_id = "323";
    var data = {
        "name": "Barack Obam2a",
        "token": "DC 20500"
    };
    
    var prom = core.idm.core.createEntity(token, entity_id, entity_type, data);
    prom.then(function(data){
        console.log('data from api: '+JSON.stringify(data));
    },function(error) {
        console.log('error: '+error);
    }).catch(function(error){
        console.log('something went wrong in the example: '+error);
    });
    
    return prom;
}

function init(_server, _core) {
    server = _server;
    settings = _core.settings;
    core = _core;

    app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(errorHandler);

    app.get("/api/version", getVersion);

    // API for Gateways
    app.post("/api/gateway/:gatewayid", gateway.add);
    app.put("/api/gateway/:gatewayid", gateway.update);
    app.get("/api/gateway/:gatewayid", gateway.get);
    app.delete("/api/gateway/:gatewayid", gateway.remove);

    app.get("/api/gateway", gateway.getAllGatewaysForUser);

    // API for Service Objects
    app.post("/api/", serviceObject.add);
    app.put("/api/:soID", serviceObject.update);
    app.get("/api/:soID", serviceObject.get);
    app.delete("/api/:soID", serviceObject.remove);

    app.get("/api/SOs", serviceObject.getAllSoForUser);
    app.get("/api/:gateway/SOs", serviceObject.getAllSoForGateway);

    // API for Sensor Data
    app.put("/api/:soID/streams/:streamid", sensorData.add);
    app.get("/api/:soID/streams/:streamid/:options", sensorData.getAllData);
    app.delete("/api/:soID/streams/:streamid", sensorData.remove);

    core.app.use(app);
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
