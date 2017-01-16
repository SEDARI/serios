/**
 * This file handles all logic concerning gateways.
 *
 * This includes API logic as well as calling the storage.
 */

var checkPermission = require("./permissionchecker").checkPermission;
var storage = require("../core/storage");

module.exports = {
    add: add,
    getDataForStream: getSensorDataForStream,
    getDataForUser: getSensorDataForUser,
    remove: remove
};

function add(req, res) {
    var authorization = req.headers.authorization;
    var soID = req.params.soID;
    var streamID = req.params.streamID;
    var sensorData = req.body;
    var ownerID;

    checkPermission(authorization).catch(function () {
        res.status(403).json({msg: "Forbidden. Access was denied!"});
    }).then(function (userID) {
        // TODO: remove dummy uid
        // ownerID = userID;
        ownerID = 1;
        // TODO: Reinsert validation (after testphase)
        // return validateSyntax(sensorData);
        return Promise.resolve();
    }).then(function () {
        return addSensorData(ownerID, soID, streamID, sensorData);
    }).then(function () {
        res.status(201).json({msg: "Data stored, accepted for dispatching."});
    }).catch(function (err) {
        if(err) {
            // TODO: Ensure async logging
            console.log(err);
            res.status(507).json({msg: "Insufficient Storage. Could not save Sensor Data."});
        } else
            res.status(400).json({msg: "Bad Request. Bad syntax used for Sensor Data."});
    });
}

function remove(req, res) {
    var authorization = req.headers.authorization;

    checkPermission(authorization).catch(function () {
        res.status(403).json({msg: "Forbidden. Access was denied!"});
    }).then(function () {
        return removeSensorData(req.params.soID, req.params.streamID);
    }).catch(function () {
        res.status(400).json({msg: "Bad Request. Could not find any data for given Stream."});
    }).then(function () {
        res.status(204);
    });
}

function getSensorDataForStream(req, res) {
    var authorization = req.headers.authorization;

    checkPermission(authorization).catch(function () {
        res.status(403).json({msg: "Forbidden. Access was denied!"});
    }).then(function () {
        return getSensorDataForStream(req.params.soID, req.params.streamID, req.params.options);
    }).then(function (data) {
        res.status(200).json({data: data});
    }).catch(function (err) {
        console.log(err);
        res.status(400).json({msg: "Bad Request. Could not find any data for given Stream."});
    });
}

function getSensorDataForUser(req, res) {
    var authorization = req.headers.authorization;
    var options = req.params.options;

    checkPermission(authorization).catch(function () {
        res.status(403).json({msg: "Forbidden. Access was denied!"});
    }).then(function (userID) {
        return getAllSensorDataForUser(userID, options);
    }).catch(function () {
        res.status(400).json({msg: "Bad Request. Could not find any data for given User."});
    }).then(function (data) {
        res.status(200).json({data: data});
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
var getSensorDataForStream = function (soID, streamID, options) {
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
    storage.getSensorDataForUser(userID, options);
};

/**
 * Calls the storage to validate the syntax of given sensor data.
 *
 * @param sensorData the sensor data that is validated.
 * @returns {Promise}
 */
var validateSyntax = function (sensorData) {
    return storage.validateSensorDataSyntax(sensorData);
};
