var express = require("express");
var path = require("path");
var nerosInstance = {};
var passport = require("passport");

function init(core) {
    core.settings.neros.SKIP_BUILD_CHECK = true;
    
    // TODO: Iterate over all flows and generate a NEROS instance
    // for each flow - store handle to this instance
    // use ids for url
    // for(var id = 0; id < 10; id++) {
    var settings = JSON.parse(JSON.stringify(core.settings.neros));

    nerosInstance = require("../../node_modules/neros/red/red.js");

    settings.httpAdminRoot = "/editor/";
    settings.httpNodeRoot = "/neros/";

    nerosInstance.init(core.api.server, settings);

    core.app.use(settings.httpAdminRoot, function(req, res, next) {
        if(req.user === undefined) {
            res.redirect("/");
            return false;
        }
        next();
    });

    /* core.app.use(settings.httpNodeRoot, function(req, res, next) {
        if(req.user === undefined) {
            res.redirect("/");
            return false;
        }
        next();
        });*/

    var checkAuth = function(req, res, next) {
        // TODO: check whether ensured-login would be a better choice
        if(req.user) {
            next();
        } else {
            console.log("check bearer");
            passport.authenticate('agile-bearer', {session: false})(req, res, next);
        }
    };
    
    core.app.use(settings.httpAdminRoot, nerosInstance.httpAdmin);
    core.app.use(settings.httpAdminRoot, express.static(path.join(__dirname, "../../public/")));
    core.app.use(settings.httpNodeRoot, checkAuth, nerosInstance.httpNode);
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
