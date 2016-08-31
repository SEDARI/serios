var express = require('express');
var when = require('when');

var server = null;
var settings = null;
var app = null;

function init(_server, _settings) {
    server = _server;
    settings = _settings;

    app = express();
}

function start() {
    require("./api").init(app);
    return when.resolve();
}

function stop() {
}

module.exports = {
    init : init,
    start : start,
    stop : stop,

    get app() { return app; }
}
