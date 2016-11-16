var IdmCore = require('../../../node_modules/agile-idm-core/');
var idmcore = null;

var settings;

module.exports = {
    init: function(_settings) {
        settings = _settings;
        idmcore = new IdmCore(settings.idm.core);
    },

    get core() { return idmcore; }
};
