var express = require("express");
var path = require("path");

var nerosInstances = {};

function init(core) {
    core.settings.neros.SKIP_BUILD_CHECK = true;
    
    // TODO: Iterate over all flows and generate a NEROS instance
    // for each flow - store handle to this instance
    // use ids for url
    for(var id = 0; id < 10; id++) {
        var settings = JSON.parse(JSON.stringify(core.settings.neros));

        nerosInstances[id] = require("../../node_modules/neros/red/red.js");

        settings.httpAdminRoot = "/editor/"+id;
        settings.httpNodeRoot = "/neros/"+id;

        nerosInstances[id].init(core.api.server, settings, id);
        core.app.use("/editor/"+id, nerosInstances[id].httpAdmin);
        core.app.use("/editor/"+id, express.static(path.join(__dirname, "../../public/")));
    }
}

function start() {
    // TODO: iterate over all NEROS instances and start them
    // in a spearate thread
    for(var id = 0; id < 10; id++) {
        return nerosInstances[id].start();
    }
}

module.exports = {
    init : init,
    start : start
};
