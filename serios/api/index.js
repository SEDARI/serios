var express = require('express');
var bodyParser = require('body-parser');

// API File for service objects (feel free to change names)
var so = require('./so');

var API_VERSION = 1;

var errorHandler = function(err, req, res, next) {
    console.log(err.stack);
    res.json(400, { error : "unexpected_error", message : err.toString() });
}

function init(app) {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended : true }));
    
    app.get("/version", getVersion);

    app.post("/", so.post);

    app.use(errorHandler);
}

function checkPermission() {
    // this is a dummy version for later authentication
    // We will use identity management from Juan David
}

function getVersion(req, res) {
    res.json({ version : API_VERSION });
}

module.exports = {
    init: init
};
