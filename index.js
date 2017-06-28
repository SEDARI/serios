var w = require('winston');
w.level = process.env.LOG_LEVEL;

// TODO: check whether more for middleware functionality is required
var api = require("./api");
var storage = require("./storage");

function init(settings, security) {
    return new Promise(function(resolve, reject) {
        if(security === undefined || security === null) {
            try {
                security = require("./security");
            } catch(e) {
                w.error(e);
                reject(e);
            }
        }

        security.init(settings.security).then(function() {
            storage.init(settings.storage).then(function() {
                api.init(settings, security, true).then(function(app) {
                    
                    resolve(app);
                }, function(e) {
                    w.error("Unable to init API component!");
                    reject(e);
                });
            }, function(e) {
                w.error("Unable to init storage component!");
                reject(e);
            });
        }, function(e) {
            w.error("Unable to init security component!");
            reject(e);
        });
    });
}

module.exports = {
    init: init
}
