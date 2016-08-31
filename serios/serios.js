var server = require("./server");

var SERIOS = {
    init : function(httpServer, settings) {
        server.init(httpServer, settings);
        return server.app;
    },
    start : server.start,
    stop : server.stop,
    
    get app() { return server.app }
};

module.exports = SERIOS;
