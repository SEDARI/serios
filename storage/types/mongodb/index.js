/**
 This file holds all the storage logic using a MongoDB database with mongoose.
*/
var clone = require("clone");
var mongoose = require("mongoose");
var rndString = require("randomstring");

var Promise = require("bluebird");

var w = require('winston');
w.level = process.env.LOG_LEVEL;

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

function valid(o) {
    return o !== undefined && o !== null;
}

/**
 * Initializes the whole database.
 *
 * @param settings the settings for the mongodb database.
 */
function init(settings) {

    // TODO: Mongoose 4.11 requires different DB setup. FIX
    // Currently useMongoClient does not work as it is buggy inside mongoose
    return new Promise(function(resolve, reject) {
        try {
            mongoose.connect("mongodb://"+settings.user+":"+settings.password+"@"+settings.host+":"+settings.port+"/"+settings.dbname).then(function() {
                resolve();
            }, function(e) {
                reject(e);
            });
        } catch(e) {
            reject(e);
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
    return new ServiceObject(so).validate();
}

function transformSO2Serios(old) {
    var newSO = clone(old);

    delete newSO.streams;
    newSO.streams = [];
    for(var s in old.streams) {
        var newStream = clone(old.streams[s]);
        newStream.name = s;
        if(newStream.channels !== undefined && newStream.channels !== null) {
            delete newStream.channels;
            newStream.channels = [];
            for(var c in old.streams[s].channels) {
                var newChannel = clone(old.streams[s].channels[c]);
                newChannel.name = c;
                newStream.channels.push(newChannel);
            }
        }
        newSO.streams.push(newStream);
    }
    return newSO;
}

function transformSOU2Serios(old) {
    var newChannels = [];
    for(var c in old.channels) {
        var newChannel = {};
        newChannel.name = c;
        var value = old.channels[c]['current-value'];
        if(value !== undefined)
            newChannel.value = value;
        newChannels.push(newChannel);
    }
    return { "channels" : newChannels, "lastUpdate" : old.lastUpdate };
}

function transformSO2Servioticy(old) {
    var newSO = clone(old);
    delete newSO.streams;
    newSO.streams = {};

    for(var s in old.streams) {
        var newStream = clone(old.streams[s]);
        if(newStream.channels !== undefined && newStream.channels !== null) {
            delete newStream.channels;
            newStream.channels = {};
            for(var c in old.streams[s].channels) {
                var newChannel = clone(old.streams[s].channels[c]);
                newStream.channels[old.streams[s].channels[c].name] = newChannel;
            }
        }
        newSO.streams[old.streams[s].name] = newStream;
    }
    return newSO;
}

function transformSOU2Servioticy(old) {
    var newChannels = {};
    for(var c in old.channels) {
        var newChannel = {};
        newChannel['current-value'] = old.channels[c].value;
        newChannels[old.channels[c].name] = newChannel;
    }
    // return { "channels" : newChannels, "lastUpdate" : old.lastUpdate };
    newUpdate = old;
    newUpdate.channels = newChannels;
    
    return newUpdate;
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

    // transform servIoTicy format to serios format
    var transSO = transformSO2Serios(newSo);

    transSO.api_token = rndString.generate();

    if (gateway && (gateway.gatewayID || (gateway.name && gateway.URL))) {
        w.debug("evaluateGatewayAndAddServiceObject with ", gateway);
        return evaluateGatewayAndAddServiceObject(gateway);
    } else {
        return ServiceObject.saveWithoutGateway(new ServiceObject(transSO));
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
                    transSO.gatewayID = foundGateway._id;
                    delete transSO.gateway;
                    return ServiceObject.saveSoGetSoId(new ServiceObject(transSO));
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
                    transSO.gateway = foundGateway._id;
                    return ServiceObject.saveSoGetSoIdAndGatewayId(new ServiceObject(transSO));
                } else {
                    // no existing gateway found? create a new one with the given information
                    gateway.owner = transSO.owner;
                    return addGateway(gateway).then(function (id) {
                        transSO.gateway = id;
                        return ServiceObject.saveSoGetSoIdAndGatewayId(new ServiceObject(transSO));
                    });
                }
            });
        }
    }
}

// TODO: COPY LATEST PHIL VERSION!!!

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
    var transSO = transformSO2Serios(newSo);

    return ServiceObject.findById(soID).exec().then(function (oldSo) {
        if(oldSo === null) {
            return Promise.reject
        }
        
        if(!valid(transSO.api_token))
            transSO.api_token = oldSo.api_token;
        
        var gateway = transSO.gateway;
        var options;

        if (gateway && (gateway.gateway || (gateway.name && gateway.URL))) {
            if (gateway.gateway && oldSo.gateway == gateway.gateway) {
                return ServiceObject.findByIdAndUpdate(soID, transSO, updateOptions).lean().exec().then(function (updatedSO) {
                    return Promise.resolve({id: updatedSO._id, gateway: updatedSO.gateway});
                });
            } else if (gateway.gateway) {
                options = {
                    _id: gateway.gateway
                };
                if (gateway.URL) {
                    options.URL = gateway.URL;
                }
                if (gateway.name) {
                    options.name = gateway.name;
                }
                return Gateway.findOne(options).lean().exec().then(function (foundGateway) {
                    if (foundGateway) {
                        transSO.gateway = foundGateway._id;
                        delete transSO.gateway;
                        return ServiceObject.findByIdAndUpdate(soID, transSO, updateOptions).lean().exec().then(function (updatedSO) {
                            return Promise.resolve({id: updatedSO._id, gateway: updatedSO.gateway});
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
                        transSO.gateway = foundGateway._id;
                        return ServiceObject.findByIdAndUpdate(soID, transSO, updateOptions).lean().exec().then(function (updatedSO) {
                            return Promise.resolve({id: updatedSO._id, gateway: updatedSO.gateway});
                        });
                    } else {
                        // no existing gateway found? create a new one with the given information
                        gateway.owner = transSO.owner;
                        return addGateway(gateway).then(function (id) {
                            transSO.gateway = id;
                            return ServiceObject.findByIdAndUpdate(soID, transSO, updateOptions).lean().exec().then(function (updatedSO) {
                                return Promise.resolve({id: updatedSO._id, gateway: updatedSO.gateway});
                            });
                        });
                    }
                });
            }
        } else {
            delete transSO.gateway;
            return ServiceObject.findByIdAndUpdate(soID, transSO, updateOptions).lean().exec().then(function (updatedSO) {
                return Promise.resolve({id: updatedSO._id, gateway: updatedSO.gateway});
            }, function(e) {
                w.error(e);
                return Promise.reject(e);
            });
        }
    }, function(err) {
        w.error(err);
        if (err instanceof NotFoundError) {
            res.status(400).json({msg: "Bad Request. Could not find Service Object."});
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
    return ServiceObject.findById(soID).lean().select("id gatewayID name description streams api_token owner").exec().then(function (mod) {
        return new Promise(function (resolve, reject) {
            if(mod === null)
                resolve(null)
            else {
                mod.id = mod._id;
                delete mod._id;
                r = transformSO2Servioticy(mod);
                resolve(r);
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
        ServiceObject.find({owner: userID}).lean().exec(function (err, sos) {
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
            if (err || !updatedGateway) {
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
    return new Promise(function(resolve, reject) {
        SensorData.validateSoID(soID).then(function () {
            w.debug("SERIOS.storage.mongodb.validateSoIdAndStreamId: SO ID is correct");
            SensorData.validateStreamID(soID, streamID).then(function(streamID) {
                w.debug("SERIOS.storage.mongodb.validateSoIdAndStreamId: stream ID is correct");
                resolve(streamID);
            }, function(e) {
                reject(e);
            });
        });
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
function validateSensorDataSyntax(userID, soID, streamID, data) {
    console.log("SERIOS.storage.mongodb.validateSensorDataSyntax");
    data.soID = soID;
    data.stream = streamID;
    return new Promise(function(resolve, reject) {
        validateSoIdAndStreamId(soID, streamID).then(function () {
            console.log("data: ", data);
            var p = new SensorData(data).validate();
            p.then(function(d) {
                resolve(d);
            }, function(e) {
                console.log(e);
                reject(e);
            })
        });
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
function addSensorData(ownerID, soID, streamID, olddata) {
    w.debug("SERIOS.storage.mongodb.addSensorData("+ownerID+", "+soID+", "+streamID+")");
    var data = transformSOU2Serios(olddata);

    data.owner = ownerID;
    data.soID = soID;
    data.stream = streamID;
    
    return validateSoIdAndStreamId(soID, streamID).then(function () {
        w.debug("SERIOS.storage.mongodb.addSensorData: SO ID and stream ID correct. Store!");
        return new SensorData(data).save();
    }).catch(function(err) {
        w.debug("SERIOS.storage.mongodb.addSensorData: ", err);
        return Promise.reject(err);
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
    w.debug("SERIOS.storage.mongodb.removeSensorData");

    return SensorData.find({soID: soID, stream: streamID}).lean().exec().then(function (foundSDs) {
        if (!foundSDs.length) {
            return Promise.reject(new NoDataFoundError("Could not find sensor data for given parameters"));
        } else {
            return SensorData.remove({soID: soID, stream: streamID}).exec();
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
function getSensorDataForStream(soID, streamID, options) {
    w.debug("SERIOS.storage.mondodb.getSensorDataForStream");

    return validateSoIdAndStreamId(soID, streamID).then(function () {
        w.debug("SERIOS.storage.mondodb.getSensorDataForStream: SO ID and stream ID are correct.");
        if(options === "lastUpdate") {
            w.debug("SERIOS.storage.mondodb.getSensorDataForStream: Retrieve last update for '"+soID+"/"+streamID+"'");
            // TODO: create an Index at installation time which supports these operations, otherwise this is extremely slow
            return SensorData.aggregate([ {$match : { 'soID' : soID, 'stream' : streamID } }, {$sort : { 'lastUpdate' : -1 } }, { $limit : 1 } ] ).exec();
        } else if(options === "all") {
            w.debug("SERIOS.storage.mondodb.getSensorDataForStream: Retrieve all data for '"+soID+"/"+streamID+"'");
            return SensorData.find({soID: soID, stream: streamID}).lean().exec();
        } else {
            w.debug("SERIOS.storage.mondodb.getSensorDataForStream: Retrieve all data for '"+soID+"/"+streamID+"'");
            return SensorData.find({soID: soID, stream: streamID}).lean().exec();
        }
    }).then(function (items) {
        w.debug("SERIOS.storage.mondodb.getSensorDataForStream -1-");
        var results = [];
        for(var i in items)
            results.push(transformSOU2Servioticy(items[i]));

        return new Promise(function (resolve, reject) {
            if (results.length === 0) {
                resolve(null);
            } else {
                resolve(results);
            }
        });
    }).catch(function(err) {
        w.debug("SERIOS.storage.mondodb.getSensorDataForStream -2-");
        return Promise.reject(err);
    });
}

/**
 * Returns an array of all sensor data for a given user.
 *
 * @param userID
 * @returns {Promise} Promise with an array of Sensor Data.
 */
function getSensorDataForUser(userID, options) {
    // TODO Phil 18/11/16: implement options support
    return SensorData.find({ownerID: userID}).lean().exec().then(function (data) {
        return new Promise(function (resolve, reject) {
            if (data.length === 0) {
                reject();
            } else {
                var newData = [];
                for(var i in data) {
                    newData.push(transformSOU2Servioticy(data[i]));
                }
                resolve(newData);
            }
        });
    });
}
