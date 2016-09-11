var express = require('express');
var bodyParser = require('body-parser');

// API File for service objects (feel free to change names)
var serviceObject = require('./serviceobject');

var API_VERSION = 1;

var errorHandler = function (err, req, res, next) {
    console.log(err.stack);
    res.json(400, {error: "unexpected_error", message: err.toString()});
};

function init(app) {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(errorHandler);

    app.get("/version", getVersion);

    // API for Service Objects
    app.post("/", serviceObject.add);
    app.put("/:soID", serviceObject.update);
    app.delete("/:soID", serviceObject.remove)
}

function getVersion(req, res) {
    res.json({version: API_VERSION});
}

module.exports = {
    init: init
};
