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
    getAllSensorDataForStream: getAllSensorDataForStream,
    getAllSensorDataForUser: getAllSensorDataForUser
};

/**
 * Initializes the whole database.
 *
 * @param settings the settings for the mongodb database.
 */
function init(settings) {
    mongoose.connect(settings.location);
}

/**
 * Validates if a given JSON has the correct Service Object syntax.
 *
 * @param so the given JSON
 * @returns {Promise} whether the given JSON has correct Service Object syntax or not.
 */
function validateServiceObjectSyntax(so) {
    return new ServiceObject(so).validate();
}

/**
 * Adds a given Service Object to the database.
 *
 * Also adds, if specified, a Gateway to the database. If no information is provided,
 * no gateway information will be saved.
 *
 * @param newSo the Service Object that is added.
 * @returns {Promise} whether adding was successful or not.
 */
function addServiceObject(newSo) {
    var gateway = newSo.gateway;
    if (gateway && (gateway.gatewayID || (gateway.name && gateway.URL))) {
        return evaluateGatewayAndAddServiceObject(gateway);
    } else {
        return ServiceObject.saveWithoutGateway(new ServiceObject(newSo));
    }

    function evaluateGatewayAndAddServiceObject(gateway) {
        var options;
        if (gateway.gatewayID) {
            options = {
                _id: gateway.gatewayID
            };
            if (gateway.URL) {
                options.URL = gateway.URL;
            }
            if (gateway.name) {
                options.name = gateway.name;
            }
            return Gateway.findOne(options).lean().exec().then(function (foundGateway) {
                if (foundGateway) {
                    newSo.gatewayID = foundGateway._id;
                    delete newSo.gateway;
                    return ServiceObject.saveSoGetSoId(new ServiceObject(newSo));
                } else {
                    return Promise.reject(new Error("Error! Could not find Gateway!"));
                }
            });
        } else {
            options = {
                name: gateway.name,
                URL: gateway.URL
            };
            return Gateway.findOne(options).lean().exec().then(function (foundGateway) {
                if (foundGateway) {
                    newSo.gatewayID = foundGateway._id;
                    return ServiceObject.saveSoGetSoIdAndGatewayId(new ServiceObject(newSo));
                } else {
                    // no existing gateway found? create a new one with the given information
                    gateway.ownerID = newSo.ownerID;
                    return addGateway(gateway).then(function (id) {
                        newSo.gatewayID = id;
                        return ServiceObject.saveSoGetSoIdAndGatewayId(new ServiceObject(newSo));
                    });
                }
            });
        }
    }
}

/**
 * Update a Service Object with given values in the database.
 *
 * @param soID the identifier of the service object that is updated.
 * @param newSo the new values for the service object.
 * @returns {Promise} whether updating was successful or not.
 */
function updateServiceObject(soID, newSo) {
    var updateOptions = {
        overwrite: true,
        runValidators: true,
        new: true
    };

    return ServiceObject.findById(soID).exec().then(function (oldSo) {
        if (!oldSo) {
            return Promise.reject(new Error("Could not find Service Object"));
        }
        var gateway = newSo.gateway;
        var options;
        if (gateway && (gateway.gatewayID || (gateway.name && gateway.URL))) {
            if (gateway.gatewayID && oldSo.gatewayID == gateway.gatewayID) {
                return ServiceObject.findByIdAndUpdate(soID, newSo, updateOptions).lean().exec().then(function (updatedSO) {
                    return Promise.resolve({soID: updatedSO._id, gatewayID: updatedSO.gatewayID});
                });
            } else if (gateway.gatewayID) {
                options = {
                    _id: gateway.gatewayID
                };
                if (gateway.URL) {
                    options.URL = gateway.URL;
                }
                if (gateway.name) {
                    options.name = gateway.name;
                }
                return Gateway.findOne(options).lean().exec().then(function (foundGateway) {
                    if (foundGateway) {
                        newSo.gatewayID = foundGateway._id;
                        delete newSo.gateway;
                        return ServiceObject.findByIdAndUpdate(soID, newSo, updateOptions).lean().exec().then(function (updatedSO) {
                            return Promise.resolve({soID: updatedSO._id, gatewayID: updatedSO.gatewayID});
                        });
                    } else {
                        return Promise.reject(new Error("Error! Could not find Gateway!"));
                    }
                });
            } else {
                options = {
                    name: gateway.name,
                    URL: gateway.URL
                };
                return Gateway.findOne(options).exec().then(function (foundGateway) {
                    if (foundGateway) {
                        newSo.gatewayID = foundGateway._id;
                        return ServiceObject.findByIdAndUpdate(soID, newSo, updateOptions).lean().exec().then(function (updatedSO) {
                            return Promise.resolve({soID: updatedSO._id, gatewayID: updatedSO.gatewayID});
                        });
                    } else {
                        // no existing gateway found? create a new one with the given information
                        gateway.ownerID = newSo.ownerID;
                        return addGateway(gateway).then(function (id) {
                            newSo.gatewayID = id;
                            return ServiceObject.findByIdAndUpdate(soID, newSo, updateOptions).lean().exec().then(function (updatedSO) {
                                return Promise.resolve({soID: updatedSO._id, gatewayID: updatedSO.gatewayID});
                            });
                        });
                    }
                });
            }
        } else {
            delete newSo.gatewayID;
            return ServiceObject.findByIdAndUpdate(soID, newSo, updateOptions).lean().exec();
        }
    });

}

/**
 * Get the description of a Service Object from the database.
 *
 * @param soID the identifier of the service object that is requested.
 * @returns {Promise} whether the Service Object exits or not.
 */
function getServiceObject(soID) {
    return ServiceObject.findById(soID).select("id gatewayID name description streams").exec().then(function (mod) {
        return new Promise(function (resolve, reject) {
            if (!mod) {
                reject();
            } else {
                resolve(mod);
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
        ServiceObject.findByIdAndRemove(soID, function (err, foundSO) {
            if (err || !foundSO) {
                reject(err);
            } else {
                resolve();
            }
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
        ServiceObject.find({gatewayID: gatewayID}).lean().exec(function (err, sos) {
            if (err || sos.length === 0) {
                reject(err);
            } else {
                var soIDs = sos.map(function (item) {
                    return item._id;
                });
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
        ServiceObject.find({ownerID: userID}).lean().exec(function (err, sos) {
            if (err || sos.length === 0) {
                reject(err);
            } else {
                var soIDs = sos.map(function (item) {
                    return item._id;
                });
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
    return new Gateway(gateway).validate();
}

/**
 * Adds a given Gateway to the database.
 *
 * @param newGateway the Gateway that is added.
 * @returns {Promise} whether adding was successful or not.
 */
function addGateway(newGateway) {
    return new Gateway(newGateway).save().then(function (gateway) {
        return Promise.resolve(gateway._id);
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
        Gateway.findByIdAndUpdate(gatewayID, gateway, {runValidators: true, new: true}, function (err, updatedGateway) {
            if (err) {
                reject(err);
            } else if (!updatedGateway) {
                reject(new Error("Could not find gateway."));
            } else {
                resolve(updatedGateway);
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
    return Gateway.findById(gatewayID).select("id gatewayID URL port").lean().exec();
}

/**
 * Removes a Gateway.
 * The appropriate service objects and its sensor data will
 * not be removed but the Service Objects will be updated.
 *
 * @param gatewayID the identifier of the gateway that is deleted.
 * @returns {Promise} whether removing was successful or not.
 */
function removeGateway(gatewayID) {
    return Gateway.findByIdAndRemove(gatewayID).lean().exec().then(function (removedGateway) {
        if (!removedGateway) {
            return Promise.reject();
        } else {
            return ServiceObject.update({gatewayID: gatewayID}, {gatewayID: undefined}, {multi: true}).exec();
        }
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
        Gateway.find({ownerID: userID}).select("id").exec(function (err, gateways) {
            if (err || gateways.length === 0) {
                reject(err);
            } else {
                var gws = gateways.map(function (item) {
                    return item._id;
                });
                resolve(gws);
            }
        });
    });
}

/**
 * Validates if the given soID and streamID exist in the database.
 *
 * @param soID the given service object identifier.
 * @param streamID the given stream identifier.
 * @returns {Promise} whether the given parameters exist in the database or not.
 */
function validateSoIdAndStreamId(soID, streamID) {
    return SensorData.validateSoID(soID)
        .then(function () {
            return SensorData.validateStreamID(soID, streamID);
        });
}

/**
 * Validates if a given JSON has the correct SensorData syntax.
 *
 * @param soID the service object of the stream.
 * @param streamID the given stream.
 * @param data the given JSON
 * @returns {Promise} whether the given JSON has correct SensorData syntax or not.
 */
function validateSensorDataSyntax(soID, streamID, data) {
    data.soID = soID;
    data.streamID = streamID;
    return validateSoIdAndStreamId(soID, streamID).then(function () {
        return new SensorData(data).validate();
    });
}

/**
 * Adds sensor data to the database for a given stream.
 *
 * @param ownerID the ownerID of the sensor data.
 * @param soID the service object of the stream.
 * @param streamID the given stream.
 * @param data the added sensor data.
 * @returns {Promise} whether adding was successful or not.
 */
function addSensorData(ownerID, soID, streamID, data) {
    data.ownerID = ownerID;
    data.soID = soID;
    data.streamID = streamID;
    return validateSoIdAndStreamId(soID, streamID).then(function () {
        return new SensorData(data).save();
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
    return SensorData.find({soID: soID, streamID: streamID}).exec().then(function (foundSDs) {
        if (!foundSDs || foundSDs.length === 0) {
            return Promise.reject(new Error("Could not find sensor data for given oarameters"));
        } else {
            var proms = [];
            foundSDs.forEach(function (data) {
                proms.push(data.remove());
            });
            return Promise.all(proms);
        }
    });
}

/**
 * Returns an array of all sensor data for a given stream.
 *
 * @param soID the service object of the stream.
 * @param streamID the given stream.
 * @returns {Promise} Promise with an array of Sensor Data.
 */
function getAllSensorDataForStream(soID, streamID, options) {
    // TODO Phil 18/11/16: implement options support
    return validateSoIdAndStreamId(soID, streamID).then(function () {
        return SensorData.find({soID: soID, streamID: streamID}).lean().exec();
    }).then(function (data) {
        return new Promise(function (resolve, reject) {
            if (data.length === 0) {
                reject();
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * Returns an array of all sensor data for a given user.
 *
 * @param userID
 * @returns {Promise} Promise with an array of Sensor Data.
 */
function getAllSensorDataForUser(userID, options) {
    // TODO Phil 18/11/16: implement options support
    return SensorData.find({ownerID: userID}).lean().exec().then(function (data) {
        return new Promise(function (resolve, reject) {
            if (data.length === 0) {
                reject();
            } else {
                resolve(data);
            }
        });
    });
}
