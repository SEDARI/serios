/**
 * This file handles all logic concerning gateways.
 *
 * This includes API logic as well as calling the storage.
 */
var checkPermission = require("./permissionchecker").checkPermission;
var AuthorizationError = require("./permissionchecker").AuthorizationError;

var storage = require("../core/storage");
var NotFoundError = require("../core/storage").NotFoundError;
var NoDataFoundError = require("../core/storage").NoDataFoundError;

var ValidationError = require("mongoose").Error.ValidationError;

module.exports = {
    add: add,
    remove: remove,

    getDataForStream: getSensorDataForStream,
    getDataForUser: getSensorDataForUser
};

function add(req, res) {
    var authorization = req.headers.authorization;
    var soID = req.params.soID;
    var streamID = req.params.streamID;
    var sensorData = req.body;
    var ownerID;

    return checkPermission(authorization).then(function (userID) {
        ownerID = userID;
        return validateSyntax(ownerID, soID, streamID, sensorData);
    }).then(function () {
        return addSensorData(ownerID, soID, streamID, sensorData);
    }).then(function () {
        res.status(201).json({msg: "Data stored, accepted for dispatching."});
    }).catch(function (err) {
        if (err instanceof AuthorizationError) {
            res.status(403).json({msg: "Forbidden. Access was denied!"});
        } else if (err instanceof ValidationError) {
            res.status(400).json({msg: "Bad Request. Bad syntax used for Sensor Data."});
        } else if (err instanceof NotFoundError) {
            res.status(400).json({msg: "Could not find Service Object or Stream ID for Service Object."});
        } else {
            res.status(500).json({msg: "Unknown Internal Server error.\n Error: " + err});
        }
    });
}

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

function getSensorDataForStream(req, res) {
    var authorization = req.headers.authorization;
    var options = req.params.options;

    if (options) {
        res.status(501).json({msg: "Options are not yet implemented"});
        return;
    }

    return checkPermission(authorization).then(function () {
        return getAllSensorDataForStream(req.params.soID, req.params.streamID, options);
    }).then(function (data) {
        res.status(200).json({data: data});
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
 * @returns {Promise}
 */
var addSensorData = function (ownerID, soID, streamID, data) {
    return storage.addSensorData(ownerID, soID, streamID, data);
};

/**
 * Calls the storage to remove ALL sensor data for a stream.
 *
 * @param soID the service object of the stream.
 * @param streamID the stream which data is removed.
 * @returns {Promise}
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
 * @returns {Promise}
 */
var getAllSensorDataForStream = function (soID, streamID, options) {
    return storage.getSensorDataForStream(soID, streamID, options);
};

/**
 * Calls the storage to get all sensor data stored for a user.
 *
 * @param userID the user the data is return for.
 * @param options query options, e.g. a timestamp.
 * @returns {Promise}
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
 * @returns {Promise}
 */
var validateSyntax = function (userID, soID, streamID, sensorData) {
    return storage.validateSensorDataSyntax(userID, soID, streamID, sensorData);
};
