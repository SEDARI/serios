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

module.exports = function SU(security, tag) {

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

        if(valid(req.user) && valid(req.user.id))
            ownerID = req.user.id;
        else {
            res.status(401).json({msg: "Request unauthorized."});
            return;
        }
        
        security.checkCreateData(req.user, soID, streamID, sensorData).then(function(decision, policy) {
            if(decision.grant) {
                addSensorData(ownerID, soID, streamID, sensorData).then(function (data) {
                    security.createData(req.user, soID, streamID, data.id).then(function() {
                        res.status(201).json({msg: "Data stored, accepted for dispatching."});
                    });
                }).catch(function (err) {
                    if (err instanceof ValidationError) {
                        res.status(400).json({msg: "Bad Request. Bad syntax used for Sensor Data. "+err});
                    } else if (err instanceof NotFoundError) {
                        res.status(404).json({msg: "Could not find Service Object or Stream ID for Service Object."});
                    } else {
                        w.error(err);
                        res.status(500).json({msg: "Unknown Internal Server error.\n Error: " + err});
                    }
                });
            } else
                res.status(403).json({msg: "User is not allowed to create updates for service object '"+soID+"'"});
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

        // TODO: for ULocks it is infeasible to delete everything
        // it should only be possible to delete those parts which are
        // writable
        
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

        getAllSensorDataForStream(req.params.soID, req.params.streamID, options).then(function (data) {
            if(data === null) {
                res.status(400).json({msg: "Bad Request. Could not find any data for given Stream."});
            } else {
                var newData = [];
                var toCheck = [];
                
                for(var i = 0; i < data.length; i++) {                  
                    toCheck.push(new Promise(function(resolve, reject) {
                        var index = i;
                        security.checkRead(req.user, data[index], "/data").then(function(d) {
                            if(d.grant) {
                                security.declassify(req.user, data[index], "/data").then(function(r) {
                                    newData.push({ channels: r.channels, lastUpdate: r.lastUpdate });
                                    resolve();
                                }, function(err) {
                                    // TODO: give some feedback in response about this event
                                    w.error("Unable to properly declassify data item retrieved by getAllSensorDataForStream.");
                                    resolve();
                                });
                            } else {
                                w.error("Unable to access data item retrieved by getAllSensorDataForStream.");
                                resolve();
                            }
                        }, function(err) {
                            reject(err);
                        });
                    }));
                }

                Promise.all(toCheck).then(function() {
                    res.status(200).json({data: newData});
                }, function(err) {
                    res.status(403).json({msg: "Forbidden. "+err});
                });
            }
        }, function(err) {
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

    function valid(o) {
        return o !== undefined && o !== null;
    }

    return {
        add: add,
        remove: remove,
        
        getDataForStream: getSensorDataForStream,
        getDataForUser: getSensorDataForUser
    };
}
