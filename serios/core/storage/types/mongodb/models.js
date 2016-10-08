/**
 * This file holds all models used in the mongoose database.
 */
var mongoose = require("mongoose");

var User = mongoose.model("User", UserSchema);
var Gateway = mongoose.model("Gateway", GatewaySchema);
var ServiceObject = mongoose.model("ServiceObject", ServiceObjectSchema);
var SensorData = mongoose.model("SensorData", SensorDataSchema);

module.exports = {
    User: User,
    Gateway: Gateway,
    ServiceObject: ServiceObject,
    SensorData: SensorData
};

/**
 * FIXME Phil 08/10/16: Should be deleted, but the queries are needed. Evaluate how this should work out.
 *
 * Creates a mongoose schema for Users.
 *
 * @returns {mongoose.Schema}
 */
function UserSchema() {
    var schema = mongoose.Schema({
            email: String,
            apitoken: String
        },
        {timestamps: true});

    schema.query.getGatewaysForUser = function (userID, cb) {
        return Gateway.find({ownerID: userID}, cb);
    };

    schema.query.getServiceObjectsForUser = function (userID, cb) {
        return getGatewaysForUser(userID, cb).forEach(function (gateway) {
            Gateway.getAllSoForGateway(gateway.id);
        });
    };

    return schema;
}

/**
 * Creates a mongoose schema for Gateways.
 *
 * @returns {mongoose.Schema}
 */
function GatewaySchema() {
    var schema = mongoose.Schema({
            ownerID: {
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
                required: true
            },
            protocol: {
                type: String,
                required: true
            }
        },
        {timestamps: true});

    schema.query.getServiceObjectsForGateway = function (gatewayID, cb) {
        return ServiceObject.find({gatewayID: gatewayID}, cb);
    };

    return schema;
}

/**
 * Creates a mongoose schema for Service Objects.
 *
 * @returns {mongoose.Schema}
 */
function ServiceObjectSchema() {
    var schema = mongoose.Schema({
            gatewayID: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: true
            },
            streams: {
                type: [SensorStreamSchema()],
                required: true
            },
            policy: {
                type: [],
                required: false
            }
        },
        {timestamps: true});

    function SensorStreamSchema() {
        var schema = mongoose.Schema({
            streamID: {
                type: String,
                required: true
            },
            sensorName: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: true
            },
            channels: {
                type: [SensorChannelSchema()],
                required: true
            }
        });

        function SensorChannelSchema() {
            var schema = mongoose.Schema({
                name: {
                    type: String,
                    required: true
                },
                dataType: {
                    type: String,
                    enum: ['number', 'string', 'boolean', 'geo_location'],
                    required: true
                },
                unit: {
                    type: String,
                    required: true
                }
            });
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
            soID: {
                type: String,
                required: true
            },
            streamID: {
                type: String,
                required: true
            },
            channels: {
                type: [ChannelDataSchema()],
                required: true
            }
        },
        {timestamps: true});

    function ChannelDataSchema() {
        var schema = mongoose.Schema({
            name: {
                type: String,
                required: true
            },
            value: {
                type: String,
                required: true
            }
        });
        return schema;
    }

    return schema;
}
