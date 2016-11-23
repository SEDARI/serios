var when = require("when");
var idm = require("./idm");
var storage = require("./storage");

var settings;
var mainApp;
var api;

function init(_settings, _api) {
    settings = _settings;
    api = _api;

    // init idm must be first
    mainApp = idm.init(settings);

    return storage.init(settings.storage);
}

function start() {
    // need to start storage, neros, etc. here
    return when.resolve();
}

function stop() {
    // need to stop storage, neros, etc. here
    return Promise.resolve();
}

module.exports = {
    init : init,
    start : start,
    stop: stop,

    storage : storage,

    get settings() { return settings; },
    get app() { return mainApp; },
    get api() { return api; },
    get idm() { return idm; }
};
