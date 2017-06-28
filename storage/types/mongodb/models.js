/**
 * This file holds all models used in the mongoose database.
 */
var mongoose = require("mongoose");

/**
 * Used to generate uuIDs.
 */
var uuid = require("uuid");

/**
 * The gateway description is further explained in the
 * {@link https://github.com/sedari/serios-docs documentation on Github}.
 *
 * @type {_mongoose.Model}
 */
var Gateway = mongoose.model("Gateway", GatewaySchema(), "gateways");
/**
 * The Service Object description is further explained in the
 * {@link https://github.com/sedari/serios-docs documentation on Github}.
 *
 * @type {_mongoose.Model}
 */
var ServiceObject = mongoose.model("ServiceObject", ServiceObjectSchema(), "serviceobjects");
/**
 * The SensorData description is further explained in the
 * {@link https://github.com/sedari/serios-docs documentation on Github}.
 *
 * @type {_mongoose.Model}
 */
var SensorData = mongoose.model("SensorData", SensorDataSchema(), "sensordata");

module.exports = {
    Gateway: Gateway,
    ServiceObject: ServiceObject,
    SensorData: SensorData
};
/**
 * Creates a mongoose schema for Gateways.
 *
 * @returns {mongoose.Schema}
 */
function GatewaySchema() {
    var schema = mongoose.Schema({
            _id: {
                type: String,
                default: uuid
            },
            owner: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            URL: {
                type: String,
                required: true
            },
            port: {
                type: Number,
                min: 1,
                max: 65535,
                required: false
            },
            protocol: {
                type: String,
                required: false
            }
        },
        {timestamps: true},
        {strict: true});

    return schema;
}

/**
 * Creates a mongoose schema for Service Objects.
 *
 * @returns {mongoose.Schema}
 */
function ServiceObjectSchema() {
    var schema = mongoose.Schema({
            _id: {
                type: String,
                default: uuid
            },
            owner: {
                type: String,
                required: [true, 'Service Object ownerID required']
            },
            gateway: {
                type: String,
                required: false
            },
            name: {
                type: String,
                // required: [true, 'Service Object name required']
                required: false
            },
            description: {
                type: String,
                // required: [true, 'Service Object description required']
                required: false
            },
            streams: {
                type: [SensorStreamSchema()],
                validate: streamsValidator,
                required: [true, 'Service Object streams required']
            },
            api_token: {
                type: String,
                required: true
            }
        },
        {timestamps: true},
        {strict: true});

    /**
     * Validates if a given stream property is not empty.
     *
     * @param streams the given stream property.
     * @returns {Boolean} if the stream property is empty.
     */
    function streamsValidator(streams) {
        return streams && streams.length;
    }

    /**
     * Saves a given service object in the database and, if successful, returns
     * an object, that contains the generated service object ID (soID) as a property.
     *
     * @param so the service object that is added.
     * @returns {Promise} whether saving was successful or not.
     */
    schema.statics.saveSoGetSoId = function (so) {
        return new Promise(function (resolve, reject) {
            so.save(function (err, savedSo) {
                if (err) {
                    reject(err);
                } else {
                    resolve({id: savedSo._id, api_token: savedSo.api_token});
                }
            });
        });
    };

    /**
     * Saves a given service object in the database and, if successful, returns
     * an object, that contains both the generated service object ID (soID) as a
     * property and the generated gateway ID (gatewayID).
     *
     * @param so the service object that is added and a gateway is generated for.
     * @returns {Promise} whether saving was successful or not.
     */
    schema.statics.saveSoGetSoIdAndGatewayId = function (so) {
        return new Promise(function (resolve, reject) {
            so.save(function (err, savedSo) {
                if (err) {
                    reject(err);
                } else {
                    resolve({id: savedSo._id, gateway: savedSo.gateway, api_token: savedSo.api_token});
                }
            });
        });
    };

    /**
     * Saves a given service object that has no gateway information
     * in the database and, if successful, returns an object, that
     * contains both the generated service object ID (soID) as a
     * property and the generated gateway ID (gatewayID).
     *
     * @param so the service object that is added and a gateway is generated for.
     * @returns {Promise} whether saving was successful or not.
     */
    schema.statics.saveWithoutGateway = function (so) {
        return new Promise(function (resolve, reject) {
            delete so.gatewayID;
            so.save(function (err, savedSo) {
                if (err) {
                    reject(err);
                } else {
                    resolve({id: savedSo._id, api_token: savedSo.api_token});
                }
            });
        });
    };

    function SensorStreamSchema() {
        var schema = mongoose.Schema({
            name: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: false
            },
            channels: {
                type: [SensorChannelSchema()],
                validate: sensorChannelValidator,
                required: true
            }
        }, { _id: false });

        /**
         * Validates if a given channels property is not empty.
         *
         * @param sensorChannel the given channels property.
         * @returns {Boolean} if the channels property is empty.
         */
        function sensorChannelValidator(sensorChannel) {
            return sensorChannel && sensorChannel.length;
        }

        function SensorChannelSchema() {
            var schema = mongoose.Schema({
                name: {
                    type: String,
                    required: true
                },
                description: {
                    type: String,
                    required: false
                },
                type: {
                    type: String,
                    lowercase: true,
                    enum: ['number', 'string', 'boolean', 'geo_location'],
                    required: true
                },
                unit: {
                    type: String,
                    required: true
                }
            }, { _id: false });
            return schema;
        }

        return schema;
    }

    return schema;
}

/**
 * Creates a mongoose schema for Sensor Data.
 *
 * @returns {mongoose.Schema}
 */
function SensorDataSchema() {
    var schema = mongoose.Schema({
        owner: {
            type: String,
            // required: [true, 'Sensor data ownerID required']
            required: false
        },
        id: {
            type: String,
            required: true
        },
        stream: {
            type: String,
            required: true
        },
        channels: {
            type: [ChannelDataSchema()],
            required: true
        },
        lastUpdate : {
            type: Number,
            required: true
        }
    },
    // Removed as time stamps should be provided at client side
    // {timestamps: true},
    {strict: true});

    /**
     * Validates if a service object for the given identifier (soID) exists.
     *
     * @param soID the given service object identifier.
     * @returns {Promise} whether the given service object exists or not.
     */
    schema.statics.validateSoID = function (soID) {
        return ServiceObject.findById(soID).lean().exec().then(function (so) {
            return new Promise(function (resolve, reject) {
                if (!so) {
                    reject(new Error("Could not find Service Object"));
                } else {
                    resolve();
                }
            });
        });
    };

    /**
     * Validates if a given stream (streamID) exists for a given service object (soID).
     *
     * @param soID the given service object identifier.
     * @param streamID the given stream identifier. This is only a valid key together with the soID.
     * @returns {Promise} whether the given stream exists for a service object or not.
     */
    schema.statics.validateStreamID = function(soID, streamID) {
        return ServiceObject.findById(soID).lean().exec().then(function (so) {
            return new Promise(function (resolve, reject) {
                if (!so) {
                    return reject(new Error("Could not find Service Object"));
                } else {
                    var array = so.streams.map(function (stream) {
                        return stream.name;
                    });

                    /*
                     * Better solution would be to call
                     * `if (array.includes(streamID)) {...}`,
                     * but it is only supported since nodejs version 6
                     * this is the alternative.
                     */
                    if (array.indexOf(streamID) >= 0) {
                        return resolve();
                    } else {
                        return reject(new Error("Could not find Stream in Service Object"));
                    }
                }
            });
        });
    };

    function ChannelDataSchema() {
        var schema = mongoose.Schema({
            name: {
                type: String,
                required: true
            },
            // TODO: Ensure that value is required but allows also empty strings
            value: {
                type: String,
                required: false,
            }
        }, { _id: false });
        return schema;
    }

    return schema;
}
