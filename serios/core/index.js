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
    
    storage.init(settings.storage);
}

function start() {
    // need to start storage, neros, etc. here
    return when.resolve();
}

module.exports = {
    init : init,
    start : start,
    
    storage : storage,
    
    settings : function() { return settings; },
    app : function() { return mainApp; },
    api : function() { return api; }
};
