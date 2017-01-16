var express = require("express");
var path = require("path");

var nerosInstance = {};

function init(core) {
    core.settings.neros.SKIP_BUILD_CHECK = true;
    
    // TODO: Iterate over all flows and generate a NEROS instance
    // for each flow - store handle to this instance
    // use ids for url
    // for(var id = 0; id < 10; id++) {
    var settings = JSON.parse(JSON.stringify(core.settings.neros));

    // nerosInstance = require("../../node_modules/neros/red/red.js");

    settings.httpAdminRoot = "/editor/";
    settings.httpNodeRoot = "/neros/";

    // nerosInstance.init(core.api.server, settings);
    // core.app.use("/editor/", nerosInstance.httpAdmin);
    // core.app.use("/editor/", express.static(path.join(__dirname, "../../public/")));
}

function start() {
    // TODO: iterate over all NEROS instances and start them
    // in a spearate thread
    // for(var id = 0; id < 10; id++) {
    nerosInstance.start();
    //}
}

module.exports = {
    init : init,
    start : start
};
