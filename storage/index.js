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

    /**
     * Constructs a new NotFoundError with a given message.
     * This error is a subclass of Error.
     *
     * This error should be thrown when an object could not be found.
     *
     * @param message the message of the error.
     * @constructor
     */
    NotFoundError: NotFoundError,
    /**
     * Constructs a new NoDataFoundError with a given message.
     * This error is a subclass of Error.
     *
     * This error should be thrown when no data is found for a correct object.
     *
     * @param message the message of the error.
     * @constructor
     */
    NoDataFoundError: NoDataFoundError,
    /**
     * Validates if a given object has the correct Service Object syntax.
     *
     * @param so the given object that represents a service object.
     * @returns {Promise} whether the given object has correct Service Object syntax or not.
     */
    validateServiceObjectSyntax: function (so) {
        return storage.validateServiceObjectSyntax(so);
    },
    /**
     * Adds a given Service Object.
     *
     * Also adds, if specified, a Gateway. If no information is provided,
     * no gateway information will be saved.
     *
     * @param so the Service Object that is added.
     * @returns {Promise} A Promise to either an object with {soID, gatewayID} properties or an error.
     */
    addServiceObject: function (so) {
        return storage.addServiceObject(so);
    },
    /**
     * Updates a Service Object with given values.
     *
     * @param soID the identifier of the service object that is updated.
     * @param so the new values for the service object.
     * @returns {Promise} A Promise to either an object with {soID, gatewayID} properties or an error.
     */
    updateServiceObject: function (soID, so) {
        return storage.updateServiceObject(soID, so);
    },
    /**
     * Gets the description of a Service Object.
     *
     * @param soID the identifier of the service object that is requested.
     * @returns {Promise} A Promise to either the requested service object or an error.
     */
    getServiceObject : function (soID) {
        return storage.getServiceObject(soID);
    },
    /**
     * Removes a Service Object for a given soID.
     *
     * @param soID the given soID used to identify the Service Object.
     * @returns {Promise} A Promise to either a resolved empty object or an error.
     */
    removeServiceObject: function (soID) {
        return storage.removeServiceObject(soID);
    },
    /**
     * Returns an array of all ServiceObjects for a given user.
     *
     * @param userID the given user.
     * @returns {Promise} A Promise to either an array of service objects or an error.
     */
    getAllSoForUser: function (userID) {
        return storage.getAllSoForUser(userID);
    },
    /**
     * Returns an array of all ServiceObject for a given gateway.
     *
     * @param gatewayID the given gateway.
     * @returns {Promise} A Promise to either an array of service objects or an error.
     */
    getAllSoForGateway: function (gatewayID) {
        return storage.getAllSoForGateway(gatewayID);
    },

    /**
     * Validates if a given object has the correct syntax for a Gateway.
     *
     * @param gateway the given gateway object.
     * @returns {Promise} a Promise to either a resolved empty object or an error.
     */
    validateGatewaySyntax : function (gateway) {
        return storage.validateGatewaySyntax(gateway);
    },
    /**
     * Adds a given Gateway.
     *
     * @param gateway the Gateway that is added.
     * @returns {Promise} A Promise to either a gatewayID or an error.
     */
    addGateway: function (gateway) {
        return storage.addGateway(gateway);
    },
    /**
     * Update a Gateway with given values.
     *
     * @param gatewayID the identifier of the gateway that is updated.
     * @param gateway the new values for the gateway.
     * @returns {Promise} A Promise to either a gatewayID or an error.
     */
    updateGateway: function (gatewayID, gateway) {
        return storage.updateGateway(gatewayID, gateway);
    },
    /**
     * Get the description of a Gateway from the database.
     *
     * @param gatewayID the identifier of the requested gateway.
     * @returns {Promise} A Promise to either a gateway object or an error.
     */
    getGateway: function (gatewayID, gateway) {
        return storage.getGateway(gatewayID, gateway);
    },
    /**
     * Removes a Gateway.
     * The appropriate service objects and its sensor data will
     * not be removed but the gateway information in the Service Objects will be updated.
     *
     * @param gatewayID the identifier of the gateway that is deleted.
     * @returns {Promise} A Promise to either a resolved empty object or an error.
     */
    removeGateway: function (gatewayID) {
        return storage.removeGateway(gatewayID);
    },
    /**
     * Returns an array of all Gateways for a given user.
     *
     * @param userID the given user.
     * @returns {Promise} A Promise to either an array of Gateways or an error.
     */
    getAllGatewaysForUser: function (userID) {
        return storage.getAllGatewaysForUser(userID);
    },

    /**
     * Validates if a given object has the correct syntax for a Sensor Data.
     *
     * @param userID the user that owns the sensor data.
     * @param soID the service object of the stream.
     * @param streamID the given stream.
     * @param data the given sensor data object.
     * @returns {Promise} A Promise to either a resolved empty object or an error.
     */
    validateSensorDataSyntax : function (userID, soID, streamID, data) {
        console.log("soID: ", soID);
        return storage.validateSensorDataSyntax(userID, soID, streamID, data);
    },
    /**
     * Adds sensor data to the database for a given stream.
     *
     * @param userID the user that owns the sensor data.
     * @param soID the service object of the stream.
     * @param streamID the given stream.
     * @param data the added sensor data.
     * @returns {Promise} A Promise to either the saved object or an error.
     */
    addSensorData: function (userID, soID, streamID, data) {
        return storage.addSensorData(userID, soID, streamID, data);
    },
    /**
     * Removes all sensor data in the database associated to a given stream.
     *
     * @param soID the service object of the stream.
     * @param streamID the given stream.
     * @returns {Promise} A Promise to either the removed object or an error.
     */
    removeSensorData : function (soID, streamID) {
        return storage.removeSensorData(soID, streamID);
    },
    /**
     * Returns an array of all sensor data for a given stream.
     *
     * @param soID the service object of the stream.
     * @param streamID the given stream.
     * @param options query options for the request.
     * @returns {Promise} A Promise to either an array of Sensor Data or an error.
     */
    getSensorDataForStream : function (soID, streamID, options) {
        return storage.getSensorDataForStream(soID, streamID, options);
    },
    /**
     * Returns an array of all sensor data for a given user.
     *
     * @param userID the identifier of the user the sensor data is returned for.
     * @param options query options for the request.
     * @returns {Promise} A Promise to either an array of Sensor Data or an error.
     */
    getSensorDataForUser : function (userID, options) {
        return storage.getSensorDataForUser(userID, options);
    }
};

/**
 * Constructs a new NotFoundError with a given message.
 * This error is a subclass of Error.
 *
 * This error should be thrown when an object could not be found.
 *
 * @param message the message of the error.
 * @constructor
 */
function NotFoundError(message) {
    this.name = "NotFoundError";
    this.message = (message || "");
}
NotFoundError.prototype = new Error();

/**
 * Constructs a new NoDataFoundError with a given message.
 * This error is a subclass of Error.
 *
 * This error should be thrown when no data is found for a correct object.
 *
 * @param message the message of the error.
 * @constructor
 */
function NoDataFoundError(message) {
    this.name = "NoDataFoundError";
    this.message = (message || "");
}
NoDataFoundError.prototype = new Error();

/**
 * Initializes the storage.
 *
 * @param settings the settings for the storage.
 */
function init(settings) {
    return new Promise(function(resolve, reject) {
        var type = settings.type;
        // TODO: add some error tolerance
        storage = require("./types/" + type);
        storage.init(settings).then(function() {
            resolve();
        }, function(e) {
            reject(e);
        });
    });
}

