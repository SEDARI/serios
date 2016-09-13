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
    addServiceObject: addServiceObject,
    editServiceObject: updateServiceObject,
    removeServiceObject: removeServiceObject
};

/**
 * Initializes the whole database and calls {@link #initSchema}.
 */
function init() {
    // TODO Phil: 11/09/16 Get the database address from e.g. the settings file
    mongoose.connect("mongodb://localhost/databasename", function (err) {
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

        schema.methods.getGatewaysForUser(function (userID, cb) {
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
 * @param so the new values for the service object.
 * @returns {Promise} whether updating was successful or not.
 */
function updateServiceObject(so) {
    return new Promise(function (resolve, reject) {
        ServiceObject.findByIdAndUpdate(so.id, so, function (err) {
            if(err)
                reject(err);
            else
                resolve();
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
            if(err)
                reject(err);
            else
                resolve();
        });
    });
}

