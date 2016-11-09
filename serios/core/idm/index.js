var idmcore = require("./idm_core");
var idmweb = require("./idm_web");

function init(settings) {
    // TODO: Ask DP whether no asynchronous action
    // are in idm init
    idmcore.init(settings);
    return idmweb.init(settings);
}

module.exports = {
    init : init,
    get core() { return idmcore.core; },
    get web() { return idmweb; }
};
