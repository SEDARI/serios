var when = require('when');
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');

// API File for service objects (feel free to change names)
var serviceObject = require('./serviceobject');

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

    app.get    ("/version",  getVersion);

    // API for Service Objects
    app.post   ("/so/",      serviceObject.add);
    app.put    ("/so/:soID", serviceObject.update);
    app.delete ("/so/:soID", serviceObject.remove);

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

    get settings() { return settings; },
    get server() { return server; }
};
