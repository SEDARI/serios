/**
 * This file handles all logic concerning gateways.
 *
 * This includes API logic as well as calling the storage.
 */
var w = require('winston');
w.level = process.env.LOG_LEVEL;

var checkPermission = require("./permissionchecker").checkPermission;
var AuthorizationError = require("./permissionchecker").AuthorizationError;

var storage = require("../storage");
var NotFoundError = require("../storage").NotFoundError;
var NoDataFoundError = require("../storage").NoDataFoundError;

var ValidationError = require("mongoose").Error.ValidationError;

module.exports = {
    add: add,
    remove: remove,

    getDataForStream: getSensorDataForStream,
    getDataForUser: getSensorDataForUser
};

/**
 * Handles a HTTP request for adding Sensor Data.
 * It handles the following cases in this order:
 *
 * The user-authorization is checked,
 * the sensor data is validated,
 * and the sensor data is saved to the storage.
 *
 * If anyone of these steps fail the process is aborted and a specific HTTP status code and message is sent.
 *
 * A resolved {Promise} is returned as the request sends a HTTP response for every case.
 *
 * @param req Represents the HTTP request with its headers and parameters. This request is handled in this function.
 * @param res Represents the HTTP response this function sends when it gets the HTTP request.
 * @returns {Promise} A Promise to be resolved.
 */
function add(req, res) {
    w.debug("SERIOS.api.sensordata.add");
    
    var authorization = req.headers.authorization;
    var soID = req.params.soID;
    var streamID = req.params.streamID;
    var sensorData = req.body;
    var ownerID;

    addSensorData(ownerID, soID, streamID, sensorData).then(function () {
        res.status(201).json({msg: "Data stored, accepted for dispatching."});
    }).catch(function (err) {
        if (err instanceof ValidationError) {
            res.status(400).json({msg: "Bad Request. Bad syntax used for Sensor Data."});
        } else if (err instanceof NotFoundError) {
            res.status(400).json({msg: "Could not find Service Object or Stream ID for Service Object."});
        } else {
            w.error(err);
            res.status(500).json({msg: "Unknown Internal Server error.\n Error: " + err});
        }
    });
}

/**
 * Handles a HTTP request for removing Sensor Data.
 * It handles the following cases in this order:
 *
 * The user-authorization is checked
 * and the sensor data is removed from the storage.
 *
 * If anyone of these steps fail the process is aborted and a specific HTTP status code and message is sent.
 *
 * A resolved {Promise} is returned as the request sends a HTTP response for every case.
 *
 * @param req Represents the HTTP request with its headers and parameters. This request is handled in this function.
 * @param res Represents the HTTP response this function sends when it gets the HTTP request.
 * @returns {Promise} A Promise to be resolved.
 */
function remove(req, res) {
    var authorization = req.headers.authorization;
    var soID = req.params.soID;
    var streamID = req.params.streamID;
    var ownerID;

    return checkPermission(authorization).then(function (userID) {
        ownerID = userID;
        return removeSensorData(soID, streamID);
    }).then(function () {
        res.status(204).json({msg: "Sensor Data successfully removed."});
    }).catch(function (err) {
        if (err instanceof AuthorizationError) {
            res.status(403).json({msg: "Forbidden. Access was denied!"});
        } else if (err instanceof NoDataFoundError) {
            res.status(400).json({msg: "Bad Request. Could not find any data for given Stream."});
        } else {
            res.status(500).json({msg: "Unknown Internal Server error.\n Error: " + err});
        }
    });
}

/**
 * Handles a HTTP request for getting Sensor Data for a Stream of a Service Object.
 * It handles the following cases in this order:
 *
 * The user-authorization is checked
 * and sensor data is queried from the storage.
 *
 * If anyone of these steps fail the process is aborted and a specific HTTP status code and message is sent.
 *
 * A resolved {Promise} is returned as the request sends a HTTP response for every case.
 *
 * @param req Represents the HTTP request with its headers and parameters. This request is handled in this function.
 * @param res Represents the HTTP response this function sends when it gets the HTTP request.
 * @returns {Promise} A Promise to be resolved.
 */
function getSensorDataForStream(req, res) {
    w.debug("SERIOS.api.sensordata.getSensorDataForStream");
    var authorization = req.headers.authorization;
    var options = req.params.options;

    /*console.log(">>>>>>>> options: " + JSON.stringify(options));

    if (options) {
        res.status(501).json({msg: "Options are not yet implemented"});
        return Promise.resolve();
        }*/
    
    getAllSensorDataForStream(req.params.soID, req.params.streamID, options).then(function (data) {
        res.status(200).json({data: data});
    }, function(err) {
        console.log("ERROR: ", err);
        if (err instanceof AuthorizationError) {
            res.status(403).json({msg: "Forbidden. Access was denied!"});
        } else if (err instanceof NoDataFoundError) {
            res.status(400).json({msg: "Bad Request. Could not find any data for given Stream."});
        } else {
            res.status(500).json({msg: "Unknown Internal Server error.\n Error: " + err});
        }
    });
}

/**
 * Handles a HTTP request for getting Sensor Data for a User.
 * It handles the following cases in this order:
 *
 * The user-authorization is checked
 * and sensor data is queried from the storage.
 *
 * If anyone of these steps fail the process is aborted and a specific HTTP status code and message is sent.
 *
 * A resolved {Promise} is returned as the request sends a HTTP response for every case.
 *
 * @param req Represents the HTTP request with its headers and parameters. This request is handled in this function.
 * @param res Represents the HTTP response this function sends when it gets the HTTP request.
 * @returns {Promise} A Promise to be resolved.
 */
function getSensorDataForUser(req, res) {
    var authorization = req.headers.authorization;
    var options = req.params.options;

    return checkPermission(authorization).then(function (userID) {
        return getAllSensorDataForUser(userID, options);
    }).then(function (data) {
        res.status(200).json({data: data});
    }).catch(function (err) {
        if (err instanceof AuthorizationError) {
            res.status(403).json({msg: "Forbidden. Access was denied!"});
        } else if (err instanceof NoDataFoundError) {
            res.status(400).json({msg: "Bad Request. Could not find any data for given User."});
        } else {
            res.status(500).json({msg: "Unknown Internal Server error.\n Error: " + err});
        }
    });
}

/**
 * Calls the storage to add sensor data for a specific stream.
 *
 * @param ownerID the owner of the added sensor data.
 * @param soID the service object of the stream.
 * @param streamID the stream that the data is pushed for.
 * @param data the data that is pushed.
 * @returns {Promise} A Promise to be resolved.
 */
var addSensorData = function (ownerID, soID, streamID, data) {
    w.debug("SERIOS.api.sensordata.addSensorData");
    return storage.addSensorData(ownerID, soID, streamID, data);
};

/**
 * Calls the storage to remove ALL sensor data for a stream.
 *
 * @param soID the service object of the stream.
 * @param streamID the stream which data is removed.
 * @returns {Promise} A Promise to be resolved.
 */
var removeSensorData = function (soID, streamID) {
    return storage.removeSensorData(soID, streamID);
};

/**
 * Calls the storage to get all sensor data stored for a stream.
 *
 * @param soID the service object of the stream.
 * @param streamID the stream which data is returned.
 * @param options query options, e.g. a timestamp.
 * @returns {Promise} A Promise to be resolved.
 */
var getAllSensorDataForStream = function (soID, streamID, options) {
    return storage.getSensorDataForStream(soID, streamID, options);
};

/**
 * Calls the storage to get all sensor data stored for a user.
 *
 * @param userID the user the data is return for.
 * @param options query options, e.g. a timestamp.
 * @returns {Promise} A Promise to be resolved.
 */
var getAllSensorDataForUser = function (userID, options) {
    return storage.getSensorDataForUser(userID, options);
};

/**
 * Calls the storage to validate the syntax of given sensor data.
 *
 * @param userID the user that adds the sensor data.
 * @param soID the service object of the stream.
 * @param streamID the stream which data is added for.
 * @param sensorData the sensor data that is validated.
 * @returns {Promise} A Promise to be resolved.
 */
var validateSyntax = function (userID, soID, streamID, sensorData) {
    console.log("soID: ", soID);
    return storage.validateSensorDataSyntax(userID, soID, streamID, sensorData);
};
