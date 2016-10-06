/**
 This file holds all the storage logic using a MongoDB database with mongoose.
 */
var mongoose = require("mongoose");

var User = require("../mongodb/models").User;
var Gateway = require("../mongodb/models").Gateway;
var ServiceObject = require("../mongodb/models").ServiceObject;
var SensorData = require("../mongodb/models").SensorData;

module.exports = {
    init: init,

    // handling for service objects
    validateServiceObjectSyntax: validateServiceObjectSyntax,
    addServiceObject: addServiceObject,
    updateServiceObject: updateServiceObject,
    getServiceObject: getServiceObject,
    removeServiceObject: removeServiceObject,

    getAllSoForGateway: getAllSoForGateway,
    getAllSoForUser: getAllSoForUser,

    // handling for gateways
    validateGatewaySyntax: validateGatewaySyntax,
    addGateway: addGateway,
    updateGateway: updateGateway,
    getGateway: getGateway,
    removeGateway: removeGateway,

    getAllGatewaysForUser: getAllGatewaysForUser,

    // handling for sensor data
    validateSensorDataSyntax: validateSensorDataSyntax,
    addSensorData: addSensorData,
    removeSensorData: removeSensorData,
    getAllSensorDataForStream: getAllSensorDataForStream
};

/**
 * Initializes the whole database.
 *
 * @param settings the settings for the mongodb database.
 */
function init(settings) {
    mongoose.connect(settings.location, function (err) {
        if (err) {
            console.error(err);
        }
    });
}

/**
 * Validates if a given JSON has the correct Service Object syntax.
 *
 * @param so the given JSON
 * @returns {Promise} whether the given JSON has correct Service Object syntax or not.
 */
function validateServiceObjectSyntax(so) {
    return new Promise(function (resolve, reject) {
        var val = new ServiceObject(so);
        val.validateBeforeSave(function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Adds a given Service Object to the database.
 *
 * @param newSo the Service Object that is added.
 * @returns {Promise} whether adding was successful or not.
 */
function addServiceObject(newSo) {
    return new Promise(function (resolve, reject) {
        var so = new ServiceObject(newSo);
        so.save(function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(so.id);
            }
        });
    });
}

/**
 * Update a Service Object with given values in the database.
 *
 * @param soID the identifier of the service object that is updated.
 * @param so the new values for the service object.
 * @returns {Promise} whether updating was successful or not.
 */
function updateServiceObject(soID, so) {
    return new Promise(function (resolve, reject) {
        ServiceObject.findByIdAndUpdate(soID, so, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Get the description of a Service Object from the database.
 *
 * @param soID the identifier of the service object that requested.
 * @returns {Promise} whether the Service Object exits or not.
 */
function getServiceObject(soID) {
    return new Promise(function (resolve, reject) {
        // TODO Phil 04/10/16: determine which fields will be returned.
        ServiceObject.findById(soID).select("id gatewayID name description streams").exec(function (err, so) {
            if (err) {
                reject(err);
            } else {
                resolve(so);
            }
        });
    });
}

/**
 * Removes a Service Object for a given soID from the database.
 *
 * @param soID the given soID used to identify the Service Object.
 * @returns {Promise} whether removing was successful or not.
 */
function removeServiceObject(soID) {
    return new Promise(function (resolve, reject) {
        // TODO Phil 04/10/16: remove appropriate sensor data as well?
        ServiceObject.findByIdAndRemove(soID, function (err) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}

/**
 * Returns an array of all ServiceObject for a given gateway.
 *
 * @param gatewayID the given gateway.
 * @returns {Promise} Promise with an array of Service Objects.
 */
function getAllSoForGateway(gatewayID) {
    return new Promise(function (resolve, reject) {
        Gateway.getServiceObjectsForGateway(gatewayID).select("id").exec(function (err, soIDs) {
            if (err || Object.keys(soIDs).length() === 0) {
                reject(err);
            } else {
                resolve(soIDs);
            }
        });
    });
}

/**
 * Returns an array of all ServiceObjects for a given user.
 *
 * @param userID the given user.
 * @returns {Promise} Promise with an array of Service Objects.
 */
function getAllSoForUser(userID) {
    return new Promise(function (resolve, reject) {
        User.getServiceObjectsForUser(userID).select("id").exec(function (err, soIDs) {
            if (err || Object.keys(soIDs).length() === 0) {
                reject(err);
            } else {
                resolve(soIDs);
            }
        });
    });
}

/**
 * Validates if a given JSON has the correct Gateway syntax.
 *
 * @param gateway the given JSON
 * @returns {Promise} whether the given JSON has correct Gateway syntax or not.
 */
function validateGatewaySyntax(gateway) {
    return new Promise(function (resolve, reject) {
        var val = new Gateway(gateway);
        val.validateBeforeSave(function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Adds a given Gateway to the database.
 *
 * @param newGateway the Gateway that is added.
 * @returns {Promise} whether adding was successful or not.
 */
function addGateway(newGateway) {
    return new Promise(function (resolve, reject) {
        var gw = new Gateway(newGateway);
        gw.save(function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(gw.id);
            }
        });
    });
}

/**
 * Update a Gateway with given values in the database.
 *
 * @param gatewayID the identifier of the gateway that is updated.
 * @param gateway the new values for the gateway.
 * @returns {Promise} whether updating was successful or not.
 */
function updateGateway(gatewayID, gateway) {
    return new Promise(function (resolve, reject) {
        Gateway.findByIdAndUpdate(gatewayID, gateway, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Get the description of a Gateway from the database.
 *
 * @param gatewayID the identifier of the requested gateway.
 * @returns {Promise} whether the Gateway exists or not.
 */
function getGateway(gatewayID) {
    return new Promise(function (resolve, reject) {
        // TODO Phil 04/10/16: determine which fields will be returned.
        Gateway.findById(gatewayID).select("id URL port").exec(function (err, gw) {
            if (err) {
                reject(err);
            } else {
                resolve(gw);
            }
        });
    });
}

/**
 * Removes a Gateway and its appropriate Service Objects from the database.
 *
 * @param gatewayID the identifier of the gateway that is deleted.
 * @returns {Promise} whether removing was successful or not.
 */
function removeGateway(gatewayID) {
    return new Promise(function (resolve, reject) {
        Gateway.findByIdAndRemove(gatewayID, function (err) {
            if (err) {
                reject(err);
            } else {
                ServiceObject.getServiceObjectsForGateway(gatewayID).remove(function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

/**
 * Returns an array of all Gateways for a given user.
 *
 * @param userID the given user.
 * @returns {Promise} Promise with an array of Gateways.
 */
function getAllGatewaysForUser(userID) {
    return new Promise(function (resolve, reject) {
        // TODO Phil 04/10/16: determine which fields will be returned.
        User.getGatewaysForUser(userID).select("id URL port").exec(function (err, gateways) {
            if (err || Object.keys(soIDs).length() === 0) {
                reject(err);
            } else {
                resolve(gateways);
            }
        });
    });
}

/**
 * Validates if a given JSON has the correct SensorData syntax.
 *
 * @param data the given JSON
 * @returns {Promise} whether the given JSON has correct SensorData syntax or not.
 */
function validateSensorDataSyntax(data) {
    return new Promise(function (resolve, reject) {
        var val = new SensorData(data);
        val.validateBeforeSave(function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Adds sensor data to the database for a given stream.
 *
 * @param soID the service object of the stream.
 * @param streamID the given stream.
 * @param data the added sensor data.
 * @returns {Promise} whether adding was successful or not.
 */
function addSensorData(soID, streamID, data) {
    return new Promise(function (resolve, reject) {
        data.soID = soID;
        data.streamID = streamID;
        var sensorData = new SensorData(data);

        sensorData.save(function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Removes all sensor data in the database associated to a given stream.
 *
 * @param soID the service object of the stream.
 * @param streamID the given stream.
 * @returns {Promise} whether removing was successful or not.
 */
function removeSensorData(soID, streamID) {
    return new Promise(function (resolve, reject) {
        SensorData.findAll({soID: soID, streamID: streamID}).remove(function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Returns an array of all sensor data for a given stream.
 *
 * @param soID the service object of the stream.
 * @param streamID the given stream.
 * @returns {Promise} Promise with an array of Sensor Data.
 */
function getAllSensorDataForStream(soID, streamID) {
    return new Promise(function (resolve, reject) {
        SensorData.findAll({
            soID: soID,
            streamID: streamID
        }).select("soID streamID channels").exec(function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}