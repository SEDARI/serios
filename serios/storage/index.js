/*
 This file handles storing data.
 It serves as a wrapper for the data storage, which can have different types like MongoDB, SQL or a storage file.
 */

var storage = null;

module.exports = {
    init: init,

    // below are the methods the storage type has to support
    addServiceObject: function (so) {
        storage.addServiceObject(so);
    },
    editServiceObject: function (so) {
        storage.editServiceObject(so);
    },
    removeServiceObject: function (soID) {
        storage.removeServiceObject(soID);
    }
};

/**
 * Initializes the storage.
 */
function init() {
    // TODO Phil: 11/09/16 get the storage type from e.g. the settings file
    storage = require("./types/" + type);
}

