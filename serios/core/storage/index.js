/**
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
    validateServiceObjectSyntax: function (so) {
        return storage.validateServiceObjectSyntax(so);
    },
    addServiceObject: function (so) {
        return storage.addServiceObject(so);
    },
    updateServiceObject: function (soID, so) {
        return storage.updateServiceObject(soID, so);
    },
    getServiceObject : function (soID) {
        return storage.getServiceObject(soID);
    },
    removeServiceObject: function (soID) {
        return storage.removeServiceObject(soID);
    },
    getAllSoForUser: function (userID) {
        return storage.getAllSoForUser(userID);
    },
    getAllSoForGateway: function (gatewayID) {
        return storage.getAllSoForGateway(gatewayID);
    },

    // gateways
    validateGatewaySyntax : function (gateway) {
        return storage.validateGatewaySyntax(gateway);
    },
    addGateway: function (gateway) {
        return storage.addGateway(gateway);
    },
    updateGateway: function (gatewayID, gateway) {
        return storage.updateGateway(gatewayID, gateway);
    },
    getGateway: function (gatewayID, gateway) {
        return storage.getGateway(gatewayID, gateway);
    },
    removeGateway: function (gatewayID) {
        return storage.removeGateway(gatewayID);
    },
    getAllGatewaysForUser: function (userID) {
        return storage.getAllGatewaysForUser(userID);
    },

    // sensor data
    validateSensorDataSyntax : function (data) {
        return storage.validateSensorDataSyntax(data);
    },
    addSensorData: function (soID, streamID, data) {
        return storage.addSensorData(soID, streamID, data);
    },
    removeSensorData : function (soID, streamID) {
        return storage.removeSensorData(soID, streamID);
    },
    getSensorDataForStream : function (soID, streamID, options) {
        return storage.getSensorDataForStream(soID, streamID, options);
    },
    getSensorDataForUser : function (userID, options) {
        return storage.getSensorDataForUser(userID, options);
    }
};

/**
 * Initializes the storage.
 *
 * @param settings the settings for the storage.
 */
function init(settings) {
    var type = settings.type;
    storage = require("./types/" + type);
    storage.init(settings);
}

