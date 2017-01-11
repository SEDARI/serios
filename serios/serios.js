var api = require("./api");
var ui = require("./ui");
var core = require("./core");
var app = null;

var SERIOS = {
    init : function(httpServer, settings) {        
        core.init(settings, api);
        app = core.app;
        
        api.init(httpServer, core);
        ui.init(httpServer, core);
    },
    start : function() {
        return core.start().then(function() { return api.start(); });
    },
    stop : function() {
        return core.stop().then(function() { return api.stop(); });
    },
    
    get app() { return app; }
};

module.exports = SERIOS;
