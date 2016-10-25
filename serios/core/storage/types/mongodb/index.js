/**
 This file holds all the storage logic using a MongoDB database with mongoose.
 */
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;

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
    mongoose.createConnection(settings.location);
}

/**
 * Validates if a given JSON has the correct Service Object syntax.
 *
 * @param so the given JSON
 * @returns {Promise} whether the given JSON has correct Service Object syntax or not.
 */
function validateServiceObjectSyntax(so) {
    // TODO Phil 08/10/16: extend validation
    return new Promise(function (resolve, reject) {
        var gateway = so.gateway;
        if (!gateway.gatewayID && !(gateway.name && gateway.URL)) {
            reject();
        }
        val.gatewayID = "spaceholder for validation";
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
 * Also adds, if not yet specified, a Gateway to the database. This gateway has to be a property
 * of the sent Service Object.
 *
 * @param newSo the Service Object that is added.
 * @returns {Promise} whether adding was successful or not.
 */
function addServiceObject(newSo) {
    return new Promise(function (resolve, reject) {
        var gateway = newSo.gateway;
        if (gateway.gatewayID && gateway.gatewayID !== "") {
            Gateway.findById(gateway.gatewayID, function (err, foundGateway) {
                if (!err && foundGateway) {
                    newSo.gatewayID = gateway.gatewayID;
                    saveSO(newSo);
                } else {
                    reject(err);
                }
            });
        } else if (gateway.name && gateway.URL) {
            Gateway.findOne({name: gateway.name, URL: gateway.URL}, function (err, foundGateway) {
                if (err) {
                    reject(err);
                } else if (foundGateway) {
                    // existing gateway found. save SO for this gateway
                    newSo.gatewayID = foundGateway.id;
                    saveSO(newSo);
                } else {
                    // no existing gateway found? create a new one with the given information
                    gateway.ownerID = ""; // TODO Phil 13/10/16: Get owner ID
                    addGateway(gateway).then(function (gatewayID) {
                        newSo.gatewayID = gatewayID;
                        saveSO(newSo);
                    }).catch(function (err) {
                        reject(err);
                    });
                }
            });
        } else {
            reject(new Error("Error: Could not save Service Object. No Gateway specified or found."));
        }

        function saveSO(newSo) {
            var so = new ServiceObject(newSo);
            so.save(function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(so.id);
                }
            });
        }
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
        ServiceObject.find({gatewayID: gatewayID}).select("id").exec(function (err, soIDs) {
            if (err || Object.keys(soIDs).length === 0) {
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
        getServiceObjectsForUser(userID).select("id").exec(function (err, soIDs) {
            if (err || Object.keys(soIDs).length === 0) {
                reject(err);
            } else {
                resolve(soIDs);
            }
        });
        function getServiceObjectsForUser(userID) {
            return Gateway.find({ownerID: userID}, function (err, gateways) {
                if (err) {
                    reject(err);
                } else {
                    gateways.forEach(function (gateway) {
                        ServiceObject.find({gatewayID: gateway.id});
                    });
                }
            });
        }
    });
}

/**
 * Validates if a given JSON has the correct Gateway syntax.
 *
 * @param gateway the given JSON
 * @returns {Promise} whether the given JSON has correct Gateway syntax or not.
 */
function validateGatewaySyntax(gateway) {
    // TODO Phil 08/10/16: extend validation
    return new Promise(function (resolve, reject) {
        var val = new Gateway(gateway);
        val.validate(function (err) {
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
                ServiceObject.find({gatewayID: gatewayID}).remove(function (err) {
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
        Gateway.find({owner:userID}).select("id URL port").exec(function (err, gateways) {
            if (err || Object.keys(gateways).length === 0) {
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
    // TODO Phil 08/10/16: extend validation

    return new Promise(function (resolve, reject) {
        var val = new SensorData(data);
        val.validate(function (err) {
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
        SensorData.find({soID: soID, streamID: streamID}).remove(function (err) {
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
        SensorData.find({
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
