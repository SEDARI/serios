var express = require("express");
var path = require("path");

var NEROS = require("../../node_modules/neros/red/red.js");

function init(core) {
    core.settings.neros.SKIP_BUILD_CHECK = true;
    core.settings.neros.httpAdminRoot = "/editor";
    
    NEROS.init(core.api.server, core.settings.neros);
    core.app.use("/editor", NEROS.httpAdmin);
    core.app.use("/editor", express.static(path.join(__dirname, "../../public/")));
}

function start() {
    return NEROS.start();
}

module.exports = {
    init : init,
    start : start
};
