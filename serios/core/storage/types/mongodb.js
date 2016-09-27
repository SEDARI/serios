/*
 This file holds all the storage logic using a MongoDB database with mongoose.
 */
var mongoose = require("mongoose");

var User = null;
var Gateway = null;
var ServiceObject = null;
var SensorData = null;

module.exports = {
    init: init,

    // handling for service objects
    validateServiceObjectSyntax : validateServiceObjectSyntax,
    addServiceObject: addServiceObject,
    updateServiceObject: updateServiceObject,
    removeServiceObject: removeServiceObject,

    getAllSoForGateway: getAllSoForGateway,
    getAllSoForUser: getAllSoForUser,

    // handling for gateways
    validateGatewaySyntax : validateGatewaySyntax,
    addGateway: addGateway,
    updateGateway: updateGateway,
    removeGateway: removeGateway,

    getAllGatewaysForUser: getAllGatewaysForUser
};

/**
 * Initializes the whole database and calls {@link #initSchema}.
 *
 * @param settings the settings for the mongodb database.
 */
function init(settings) {
    mongoose.connect(settings.location, function (err) {
        if (err) {
            console.error(err);
        } else {
            initSchema();
        }
    });
}

/**
 * Initializes the database schema.
 * Creates the schema for:
 * <p><ul>
 * <li> User
 * <li> Gateway
 * <li> ServiceObject
 * <li> SensorData
 * </ul><p>
 */
function initSchema() {
    User = mongoose.model("User", createUserSchema());
    Gateway = mongoose.model("Gateway", createGatewaySchema());
    ServiceObject = mongoose.model("ServiceObject", createServiceObjectSchema());
    SensorData = mongoose.model("SensorData", createSensorDataSchema());

    function createUserSchema() {
        var schema = mongoose.Schema({
            userID: String,
            email: String,
            // TODO Phil: 11/09/16 handle password storage differently?
            password: String,
            apitoken: String,
            timestamps: true
        });

        schema.query.getGatewaysForUser(function (userID, cb) {
            return Gateway.find({ownerID: userID}, cb);
        });

        return schema;
    }

    function createGatewaySchema() {
        var schema = mongoose.Schema({
            gatewayID: String,
            gatewayToken: String,
            ownerID: String,
            hostname: String,
            port: Number,
            protocol: String,
            timestamps: true
        });

        schema.query.getServiceObjectsForGateway(function (gatewayID, cb) {
            return ServiceObject.find({gatewayID: gatewayID}, cb);
        });

        return schema;
    }

    function createServiceObjectSchema() {
        var schema = mongoose.Schema({
            soID: String,
            gatewayID: String,
            name: String,
            description: String,
            streams: [createSensorStreamSchema()],
            policy: [],
            timestamps: true
        });

        function createSensorStreamSchema() {
            var schema = mongoose.Schema({
                streamID: String,
                sensorName: String,
                description: String,
                channels: [createSensorChannelSchema()]
            });

            function createSensorChannelSchema() {
                var schema = mongoose.Schema({
                    name: String,
                    dataType: {
                        type: String,
                        enum: ['number', 'string', 'boolean', 'geo_location']
                    },
                    unit: String
                });
                return schema;
            }

            return schema;
        }

        return schema;
    }

    function createSensorDataSchema() {

        var schema = mongoose.Schema({
            channels: [createChannelDataSchema()],
            timestamps: true
        });

        function createChannelDataSchema() {
            var schema = mongoose.Schema({
                name: String,
                value: String
            });
            return schema;
        }

        return schema;
    }
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
 * Removes a Service Object for a given soID from the database.
 *
 * @param soID the given soID used to identify the Service Object.
 * @returns {Promise} whether removing was successful or not.
 */
function removeServiceObject(soID) {
    return new Promise(function (resolve, reject) {
        ServiceObject.findByIdAndRemove(soID, function (err) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}

function getAllSoForGateway(gatewayID) {
    return new Promise(function (resolve, reject) {
        // TODO Phil 13/09/16: fill method with love
    })
}

/**
 * Returns an array of all ServiceObjects for a given user.
 *
 * @param userID the given user.
 * @returns {Array} An array of Service Objects.
 */
function getAllSoForUser(userID) {
    var soIDs = [];
    User.getAllGatewaysForUser(userID).forEach(function (entry) {
            soIDs.push(entry);
        }
    );
    return soIDs;
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

function addGateway(newGateway) {
    return new Promise(function (resolve, reject) {
        // TODO Phil 13/09/16: fill methods with love
    });
}

function updateGateway(gatewayID, gateway) {
    return new Promise(function (resolve, reject) {
        // TODO Phil 13/09/16: fill methods with love
    });
}


function removeGateway(gatewayID) {
    return new Promise(function (resolve, reject) {
        // TODO Phil 13/09/16: fill methods with love
    });
}


/**
 * Returns an array of all Gateways for a given user.
 *
 * @param userID the given user.
 * @returns {Array} An array of Gateways.
 */
function getAllGatewaysForUser(userID) {
    return User.getGatewaysForUser(userID);

}
