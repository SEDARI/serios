/**
 * This file handles all logic concerning gateways.
 *
 * This includes API logic as well as calling the storage.
 */

var permissionChecker = require("./permissionchecker");
var storage = require("../core/storage");

module.exports = {
    add: add,
    getAllData: getSensorData,
    remove: remove
};

function add(req, res) {
    permissionChecker.checkPermission().catch(function () {
        res.status(403).json({msg: "Forbidden. Access was denied!"});
    }).then(validateSyntax(req.body)).catch(function () {
        res.status(400).json({msg: "Bad Request. Bad syntax used for Sensor Data."});
    }).then(addSensorData(req.params.soID, req.params.streamID, req.body)).catch(function () {
        res.status(507).json({msg: "Insufficient Storage. Could not save Sensor Data."});
    }).then(function () {
        res.status(201).json({msg: "Data stored, accepted for dispatching."});
    });
}

function remove(req, res) {
    permissionChecker.checkPermission(req).catch(function () {
        res.status(403).json({msg: "Forbidden. Access was denied!"});
    }).then(removeSensorData(req.params.soID, req.params.streamID)).catch(function () {
        res.status(400).json({msg: "Bad Request. Could not find any data for given Stream."});
    }).then(function () {
        res.status(204);
    });
}

function getSensorData(req, res) {
    permissionChecker.checkPermission(req).catch(function () {
        res.status(403).json({msg: "Forbidden. Access was denied!"});
    }).then(getAllSensorData(req.params.soID, req.params.streamID)).catch(function () {
        res.status(400).json({msg: "Bad Request. Could not find any data for given Stream."});
    }).then(function (data) {
        res.status(200).json({data: data});
    });
}

/**
 * Calls the storage to add sensor data for a specific stream.
 *
 * @param soID the service object of the stream.
 * @param streamID the stream that the data is pushed for.
 * @param data the data that is pushed.
 * @returns {Promise}
 */
var addSensorData = function (soID, streamID, data) {
    storage.addSensorData(soID, streamID, data);
};

/**
 * Calls the storage to remove ALL sensor data for a stream.
 *
 * @param soID the service object of the stream.
 * @param streamID the stream which data is removed.
 * @returns {Promise}
 */
var removeSensorData = function (soID, streamID) {
    storage.removeSensorData(soID, streamID);
};

/**
 * Calls the storage to get all sensor data stored for a stream.
 *
 * @param soID the service object of the stream.
 * @param streamID the stream which data is returned.
 * @returns {Promise}
 */
var getAllSensorData = function (soID, streamID) {
    storage.getSensorDataForStream(soID, streamID);
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
