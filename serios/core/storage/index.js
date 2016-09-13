/*
 This file handles storing data.
 It serves as a wrapper for the data storage, which can have different types like MongoDB, SQL or a storage file.
 */

var storage = null;

/**
 * These are all the methods the storage type has to support.
 */
module.exports = {
    init: init,

    // service objects
    addServiceObject: function (so) {
        storage.addServiceObject(so);
    },
    updateServiceObject: function (soID, so) {
        storage.updateServiceObject(soID, so);
    },
    removeServiceObject: function (soID) {
        storage.removeServiceObject(soID);
    },
    getAllSoForUser: function (soID) {
        storage.getAllSoForUser(soID);
    },
    getAllSoForGateway: function (gatewayID) {
        storage.getAllSoForGateway(gatewayID);
    },

    // gateways
    addGateway: function (gateway) {
        storage.addGateway(gateway);
    },
    updateGateway: function (gatewayID, gateway) {
        storage.updateGateway(gatewayID, gateway);
    },
    removeGateway: function (gatewayID) {
        storage.removeGateway(gatewayID);
    },
    getAllGatewaysForUser: function (userID) {
        storage.getAllGatewaysForUser(userID);
    }
};

/**
 * Initializes the storage.
 */
function init(settings) {
    // TODO Phil: 11/09/16 get the storage type from e.g. the settings file
    type = "mongodb";
    storage = require("./types/" + type);
}

