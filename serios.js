#!/usr/bin/env node
var express = require('express');
var cluster = require('cluster');

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

if (cluster.isMaster) {
    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }
} else {
    var SERIOS = require("./serios/serios.js");
    SERIOS.init(null, settings);

    var app = express();
    app.use("/", SERIOS.app);
    SERIOS.start().then(function() {
        app.listen(settings.server.port,
                   settings.server.host,
                   function () {
                       process.tite = "SERIOS Server";
                       console.log('Server now running at '+getListenPath());
                   });
    }).catch(function(err) {
        console.log('Failed to start server');
        console.log(err);
    });
}


function getListenPath() {
    var listenPath = 'http' + (settings.server.tls ? 's' : '') + '://'+
        (settings.server.host == '0.0.0.0' ? '127.0.0.1' : settings.server.host)+
        ':'+settings.server.port + "/";
    return listenPath;
}
