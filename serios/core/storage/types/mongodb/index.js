/**
 This file holds all the storage logic using a MongoDB database with mongoose.
 */
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;

var Gateway = require("../mongodb/models").Gateway;
var ServiceObject = require("../mongodb/models").ServiceObject;
var SensorData = require("../mongodb/models").SensorData;

var NotFoundError = require("../../../storage").NotFoundError;
var NoDataFoundError = require("../../../storage").NoDataFoundError;

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
    getSensorDataForStream: getSensorDataForStream,
    getSensorDataForUser: getSensorDataForUser
};

/**
 * Initializes the whole database.
 *
 * @param settings the settings for the mongodb database.
 * @return {Promise}
 */
function init(settings) {
    return new Promise(function (resolve, reject) {
        mongoose.connect(settings.location, function (err) {
            if (err) {
                reject(err + "\nDid you forgot to start the mongo demon? Start it with `mongod`.");
            } else {
                resolve();
            }
        });
    });
}

/**
 * Validates if a given object has the correct syntax for a Service Object.
 *
 * @param so the given object that represents a service object.
 * @throws {mongoose.Error.ValidationError} Failed validation.
 * @returns {Promise} a promise to a resolved empty object or an error.
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
 * @throws {NotFoundError} Could not find Gateway.
 * @returns {Promise} A Promise to either an object with {soID, gatewayID} properties or an error.
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
                    return Promise.reject(new NotFoundError("Error! Could not find Gateway!"));
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
 * Updates a Service Object with given values in the database.
 *
 * @param soID the identifier of the service object that is updated.
 * @param newSo the new values for the service object.
 * @throws {NotFoundError} Could not find Service Object
 * @throws {NoDataFoundError} Could not find Gateway.
 * @returns {Promise} A Promise to either an object with {soID, gatewayID} properties or an error.
 */
function updateServiceObject(soID, newSo) {
    var updateOptions = {
        overwrite: true,
        runValidators: true,
        new: true
    };

    function validateFindAndUpdateById(soID, newSo) {
        return validateServiceObjectSyntax(newSo).then(function () {
            return ServiceObject.findByIdAndUpdate(soID, newSo, updateOptions).lean().exec();
        }).then(function (updatedSO) {
            return Promise.resolve({soID: updatedSO._id, gatewayID: updatedSO.gatewayID});
        });
    }

    return ServiceObject.findById(soID).lean().exec().then(function (oldSo) {
        if (!oldSo) {
            return Promise.reject(new NotFoundError("Could not find Service Object"));
        }
        var gateway = newSo.gateway;
        var options;
        if (gateway && (gateway.gatewayID || (gateway.name && gateway.URL))) {
            if (gateway.gatewayID && oldSo.gatewayID == gateway.gatewayID) {
                return validateFindAndUpdateById(soID, newSo);
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
                        return validateFindAndUpdateById(soID, newSo);
                    } else {
                        return Promise.reject(new NoDataFoundError("Error! Could not find Gateway!"));
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
                        return validateFindAndUpdateById(soID, newSo);
                    } else {
                        // no existing gateway found? create a new one with the given information
                        gateway.ownerID = newSo.ownerID;
                        return addGateway(gateway).then(function (id) {
                            newSo.gatewayID = id;
                            return validateFindAndUpdateById(soID, newSo);
                        });
                    }
                });
            }
        } else {
            delete newSo.gatewayID;
            return validateFindAndUpdateById(soID, newSo);
        }
    });

}

/**
 * Gets the description of a Service Object from the database.
 *
 * @param soID the identifier of the service object that is requested.
 * @throws {NotFoundError} Could not find Service Object.
 * @returns {Promise} A Promise to either the requested service object or an error.
 */
function getServiceObject(soID) {
    return ServiceObject.findById(soID).select("id gatewayID name description streams").exec().then(function (mod) {
        if (!mod) {
            return Promise.reject(new NotFoundError("Could not find service object for given parameters"));
        } else {
            return Promise.resolve(mod);
        }
    });
}

/**
 * Removes a Service Object for a given soID from the database.
 *
 * @param soID the given soID used to identify the Service Object.
 * @throws {NotFoundError} Could not find Service Object.
 * @returns {Promise} A Promise to either a resolved empty object or an error.
 */
function removeServiceObject(soID) {
    return ServiceObject.findByIdAndRemove(soID).lean().exec().then(function (foundSO) {
        if (!foundSO) {
            return Promise.reject(new NotFoundError("Could not find Service Object for given parameters"));
        } else {
            return Promise.resolve();
        }
    });
}

/**
 * Returns an array of all ServiceObject for a given gateway.
 *
 * @param gatewayID the given gateway.
 * @throws {NotFoundError} Could not find Gateway.
 * @throws {NoDataFoundError} Could not find Service Objects for Gateway.
 * @returns {Promise} A Promise to either an array of service objects or an error.
 */
function getAllSoForGateway(gatewayID) {
    return Gateway.findById(gatewayID).lean().exec().then(function (foundSO) {
        if (!foundSO) {
            return Promise.reject(new NotFoundError("Could not find Gateway"));
        }
    }).then(function () {
        return ServiceObject.find({gatewayID: gatewayID}).lean().exec();
    }).then(function (sos) {
        if (!sos.length) {
            return Promise.reject(new NoDataFoundError("Could not find Service Objects for Gateway"));
        } else {
            var soIDs = sos.map(function (item) {
                return item._id;
            });
            return Promise.resolve(soIDs);
        }
    });
}

/**
 * Returns an array of all ServiceObjects for a given user.
 *
 * @param userID the given user.
 * @throws {NoDataFoundError} Could not find Service Objects for User.
 * @returns {Promise} A Promise to either an array of service objects or an error.
 */
function getAllSoForUser(userID) {
    return ServiceObject.find({ownerID: userID}).lean().exec().then(function (sos) {
        if (!sos.length) {
            return Promise.reject(new NoDataFoundError("Could not find Service Objects for User"));
        } else {
            var soIDs = sos.map(function (item) {
                return item._id;
            });
            return Promise.resolve(soIDs);
        }
    });
}

/**
 * Validates if a given object has the correct syntax for a Gateway.
 *
 * @param gateway the given gateway object.
 * @throws {mongoose.Error.ValidationError} Failed validation.
 * @returns {Promise} a Promise to either a resolved empty object or an error.
 */
function validateGatewaySyntax(gateway) {
    return new Gateway(gateway).validate();
}

/**
 * Adds a given Gateway to the database.
 *
 * @param newGateway the Gateway that is added.
 * @returns {Promise} A Promise to either a gatewayID or an error.
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
 * @throws {NotFoundError} Could not find Gateway.
 * @returns {Promise} A Promise to either a gatewayID or an error.
 */
function updateGateway(gatewayID, gateway) {
    return Gateway.findByIdAndUpdate(gatewayID, gateway, {
        runValidators: true,
        new: true
    }).lean().exec().then(function (updatedGateway) {
        if (!updatedGateway) {
            return Promise.reject(new NotFoundError("Could not find gateway."));
        } else {
            return Promise.resolve(updatedGateway._id);
        }
    });
}

/**
 * Get the description of a Gateway from the database.
 *
 * @param gatewayID the identifier of the requested gateway.
 * @throws {NotFoundError} Could not find Gateway.
 * @returns {Promise} A Promise to either a gateway object or an error.
 */
function getGateway(gatewayID) {
    return Gateway.findById(gatewayID).select("id gatewayID URL port").lean().exec().then(function (foundGateway) {
        if (!foundGateway) {
            return Promise.reject(new NotFoundError("Could not find gateway."));
        } else {
            return Promise.resolve(foundGateway);
        }
    });
}

/**
 * Removes a Gateway.
 * The appropriate service objects and its sensor data will
 * not be removed but the gateway information in the Service Objects will be updated.
 *
 * @param gatewayID the identifier of the gateway that is deleted.
 * @throws {NotFoundError} Could not find Gateway.
 * @returns {Promise} A Promise to either a resolved empty object or an error.
 */
function removeGateway(gatewayID) {
    return Gateway.findByIdAndRemove(gatewayID).lean().exec().then(function (removedGateway) {
        if (!removedGateway) {
            return Promise.reject(new NotFoundError("Could not find gateway."));
        } else {
            return ServiceObject.update({gatewayID: gatewayID}, {gatewayID: undefined}, {multi: true}).exec().then(function () {
                return Promise.resolve();
            });
        }
    });
}

/**
 * Returns an array of all Gateways for a given user.
 *
 * @param userID the given user.
 * @throws {NoDataFoundError} Could not find data for User.
 * @returns {Promise} A Promise to either an array of Gateways or an error.
 */
function getAllGatewaysForUser(userID) {
    return Gateway.find({ownerID: userID}).select("id").lean().exec().then(function (gateways) {
        if (!gateways.length) {
            return Promise.reject(new NoDataFoundError("Could not find gateways for given parameters"));
        } else {
            var gws = gateways.map(function (item) {
                return item._id;
            });
            return Promise.resolve(gws);
        }
    });
}

/**
 * Validates if the given soID and streamID exist in the database.
 *
 * @param soID the given service object identifier.
 * @param streamID the given stream identifier.
 * @throws {NotFoundError} when service object or streamID could not be found.
 * @returns {Promise} A Promise to either a resolved empty object or an error.
 */
function validateSoIdAndStreamId(soID, streamID) {
    return SensorData.validateSoID(soID).then(function () {
        return SensorData.validateStreamID(soID, streamID);
    });
}

/**
 * Validates if a given object has the correct syntax for a Sensor Data.
 *
 * @param ownerID the ownerID of the sensor data.
 * @param soID the service object of the stream.
 * @param streamID the given stream.
 * @param data the given sensor data object.
 * @throws {mongoose.Error.ValidationError} Failed validation.
 * @returns {Promise} A Promise to either a resolved empty object or an error.
 */
function validateSensorDataSyntax(ownerID, soID, streamID, data) {
    data.ownerID = ownerID;
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
 * @returns {Promise} A Promise to either the saved object or an error.
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
 * @throws {NoDataFoundError} Could not find Sensor Data.
 * @returns {Promise} A Promise to either the removed object or an error.
 */
function removeSensorData(soID, streamID) {
    return SensorData.find({soID: soID, streamID: streamID}).lean().exec().then(function (foundSDs) {
        if (!foundSDs.length) {
            return Promise.reject(new NoDataFoundError("Could not find sensor data for given parameters"));
        } else {
            return SensorData.remove({soID: soID, streamID: streamID}).exec();
        }
    });
}

/**
 * Returns an array of all sensor data for a given stream.
 *
 * @param soID the service object of the stream.
 * @param streamID the given stream.
 * @param options query options for the request.
 * @throws {NoDataFoundError} Could not find Sensor Data.
 * @returns {Promise} A Promise to either an array of Sensor Data or an error.
 */
function getSensorDataForStream(soID, streamID, options) {
    // TODO Phil 18/11/16: implement options support for this and {@clink #getSensorDataForUser}.
    return SensorData.find({soID: soID, streamID: streamID}).lean().exec()
        .then(function (data) {
            if (!data.length) {
                return Promise.reject(new NoDataFoundError("Could not find sensor data for given parameters"));
            } else {
                return Promise.resolve(data);
            }
        });
}

/**
 * Returns an array of all sensor data for a given user.
 *
 * @param userID the identifier of the user the sensor data is returned for.
 * @param options query options for the request.
 * @throws {NoDataFoundError} Could not find Sensor Data.
 * @returns {Promise} A Promise to either an array of Sensor Data or an error.
 */
function getSensorDataForUser(userID, options) {
    return SensorData.find({ownerID: userID}).lean().exec().then(function (data) {
        if (!data.length) {
            return Promise.reject(new NoDataFoundError("Could not find sensor data for given parameters"));
        } else {
            return Promise.resolve(data);
        }
    });
}
