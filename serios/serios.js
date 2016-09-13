var api = require("./api");
var core = require("./core");

var app = null;

var SERIOS = {
    init : function(httpServer, settings) {
        core.init(settings, api);
        api.init(httpServer, core);

        app = core.app();
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
