#!/usr/bin/env node

var http = require('http');
var https = require('https');
var express = require('express');
var util = require('util');
var fs = require('fs');

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

if(!settings.server.tls) {
    server = http.createServer(function(req, res) { app(req, res); });
} else {
    var options = {
        key: fs.readFileSync(settings.idm.tls.key),
        cert: fs.readFileSync(settings.idm.tls.cert),
        requestCert: true
    };
    server = https.createServer(options, function(req, res) { app(req, res); });
}
server.setMaxListeners(0);

SERIOS.init(server, settings);

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
    server.listen(settings.server.port,
                  settings.server.host,
                  function () {
                      process.tite = "SERIOS Server";
                      console.log('Server now running at '+getListenPath());
                  });
}).otherwise(function(err) {
    console.log('Failed to start server');
    console.log(err);
});

function getListenPath() {
    var listenPath = 'http' + (settings.server.tls ? 's' : '') + '://'+
        (settings.server.host == '0.0.0.0' ? '127.0.0.1' : settings.server.host)+
        ':'+settings.server.port + "/";
    return listenPath;
}
