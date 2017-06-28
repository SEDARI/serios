#!/usr/bin/env node

var express = require('express');
var logger = require('morgan');

var serios = require("./index.js");
var server = null;

var callback = function() {
    console.log("SERIOS up and running.");
}

function init() {

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
        return Promise.reject();
    }

    var useCluster = false;
    var cluster = null;
    if(settings.server && settings.server.cluster && settings.server.cluster > 0) {
        cluster = require('cluster');
        useCluster = true;
    }

    // TODO: reshape code respecting promises 
    if (useCluster && cluster.isMaster) {
        // Count the machine's CPUs
        var cpuCount = require('os').cpus().length;
        if(settings.server.cluster < cpuCount)
            cpuCount = settings.server.cluster;
        
        // Create a worker for each CPU
        for (var i = 0; i < cpuCount; i += 1) {
            cluster.fork();
        }
    } else {
        var app = express();
        
        // ensure connections are closed after request
        // has been served
        app.use(function(req, res, next) {
            res.setHeader('Connection', 'close');
            next();
        });
        
        app.use(logger('dev'));

        // no IDM in place, just pretend user with id 0
        app.use(function(req, res, next) {
            req.user = { id : 0 };
            next();
        });

        console.log("LISTEN ON ", settings.server.port);
        server = app.listen(settings.server.port, settings.server.host,
                            function () {
                                process.tite = "SERIOS Server";
                                console.log('SERIOS server spawned at '+getListenPath(settings));
                                
                                serios.init(settings).then(function(a) {
                                    app.use("/" + settings.rest.prefix, a);
                                    callback();
                                }, function(err) {
                                    console.log('Failed to start SERIOS server');
                                    console.log(err);
                                });
                            });
    }
};

function getListenPath(settings) {
    var listenPath = 'http' + (settings.server.tls ? 's' : '') + '://'+
        (settings.server.host == '0.0.0.0' ? '127.0.0.1' : settings.server.host)+
        ':'+settings.server.port + "/";
    var path = "serios";
    if(settings.rest && settings.rest.prefix) {
        path = settings.rest.prefix;
        if(path[0] === '/')
            path = path.substring(1);
        if(path.length === 0)
            path = "serios";
    }
    return listenPath + path;
}

if(require.main === module)
    init();

module.exports = function(newCallback) {
    if(newCallback)
        callback = newCallback;
    console.log("Start serios");
    init();
    
    return {
        server: server
    }
};
