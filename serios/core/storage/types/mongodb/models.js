/**
 * This file holds all models used in the mongoose database.
 */
var mongoose = require("mongoose");

var uuid = require("node-uuid");

var Gateway = mongoose.model("Gateway", GatewaySchema());
var ServiceObject = mongoose.model("ServiceObject", ServiceObjectSchema());
var SensorData = mongoose.model("SensorData", SensorDataSchema());

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
                type: String, default: uuid.v4
            },
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
                required: false
            },
            protocol: {
                type: String,
                required: false
            }
        },
        {timestamps: true});

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
                type: String, default: uuid.v4
            },
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
