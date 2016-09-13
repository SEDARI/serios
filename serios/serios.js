var api = require("./api");
var core = require("./core");
var neros = require("./neros");

var app = null;

var SERIOS = {
    init : function(httpServer, settings) {
        core.init(settings, api);
        app = core.app;
        
        api.init(httpServer, core);

        neros.init(core);
    },
    start : function() {
        return core.start().
            then(function() { return neros.start(); }).
            then(function() { return api.start(); });
    },
    stop : function() {
        return core.stop().then(function() { return api.stop(); });
    },
    
    get app() { return app; }
};

module.exports = SERIOS;
