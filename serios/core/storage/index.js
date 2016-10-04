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
        storage.validateServiceObjectSyntax(so);
    },
    addServiceObject: function (so) {
        storage.addServiceObject(so);
    },
    updateServiceObject: function (soID, so) {
        storage.updateServiceObject(soID, so);
    },
    getServiceObject : function (soID) {
        storage.getServiceObject(soID);
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
    validateGatewaySyntax : function (gateway) {
        storage.validateGatewaySyntax(gateway);
    },
    addGateway: function (gateway) {
        storage.addGateway(gateway);
    },
    updateGateway: function (gatewayID, gateway) {
        storage.updateGateway(gatewayID, gateway);
    },
    getGateway: function (gatewayID, gateway) {
        storage.getGateway(gatewayID, gateway);
    },
    removeGateway: function (gatewayID) {
        storage.removeGateway(gatewayID);
    },
    getAllGatewaysForUser: function (userID) {
        storage.getAllGatewaysForUser(userID);
    },

    // sensor data
    validateSensorDataSyntax : function (data) {
        storage.validateSensorDataSyntax(data);
    },
    addSensorData: function (soID, streamID, data) {
        storage.addSensorData(soID, streamID, data);
    },
    removeSensorData : function (soID, streamID) {
        storage.removeSensorData(soID, streamID);
    },
    getSensorDataForStream : function (soID, streamID) {
        storage.getSensorDataForStream(soID, streamID);
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

