#!/usr/bin/env node

var http = require('http');
var https = require('https');
var express = require('express');
var util = require('util');

var SERIOS = require("./serios/serios.js");

var app = express();

var settingsFile = "./settings";
try {
    var settings = require(settingsFile);
    settings.settingsFile = settingsFile;
} catch(err) {
    if (err.code == 'MODULE_NOT_FOUND') {
        console.log("Unable to load settings file: "+settingsFile);
    } else {
        console.log(err);
    }
    process.exit();
}

server = http.createServer(function(req, res) { app(req, res); });
server.setMaxListeners(0);

SERIOS.init(server, null);

app.use("/", SERIOS.app);

SERIOS.start().then(function() {
    server.on('error', function(err) {
        if (err.errno === "EADDRINUSE") {
            console.error('Unable to listen on '+getListenPath());
            console.error('Error: port in use');
        } else {
            console.error('Uncaught Exception:');
            if (err.stack) {
                console.error(err.stack);
            } else {
                console.error(err);
            }
        }
        process.exit(1);
    });
    server.listen(settings.httpServer.port,
                  settings.httpServer.host,
                  function () {
                      process.tite = "SERIOS Server";
                      console.log('Server now running at '+getListenPath());
                  });
}).otherwise(function(err) {
    console.log('Failed to start server');
    console.log(err);
});

function getListenPath() {
    var listenPath = 'http://'+
        (settings.httpServer.host == '0.0.0.0' ? '127.0.0.1' : settings.httpServer.host)+
        ':'+settings.httpServer.port + "/";
    return listenPath;
}
