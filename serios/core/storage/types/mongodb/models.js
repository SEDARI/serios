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
 * Creates a mongoose schema for Users.
 *
 * @returns {mongoose.Schema}
 */
function UserSchema() {
    var schema = mongoose.Schema({
            userID: String,
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
            gatewayID: String,
            gatewayToken: String,
            ownerID: String,
            URL: String,
            port: Number,
            protocol: String
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
            soID: String,
            gatewayID: String,
            name: String,
            description: String,
            streams: [SensorStreamSchema()],
            policy: []
        },
        {timestamps: true});

    function SensorStreamSchema() {
        var schema = mongoose.Schema({
            streamID: String,
            sensorName: String,
            description: String,
            channels: [SensorChannelSchema()]
        });

        function SensorChannelSchema() {
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

/**
 * Creates a mongoose schema for Sensor Data.
 *
 * @returns {mongoose.Schema}
 */
function SensorDataSchema() {

    var schema = mongoose.Schema({
            soID: String,
            streamID: String,
            channels: [ChannelDataSchema()]
        },
        {timestamps: true});

    function ChannelDataSchema() {
        var schema = mongoose.Schema({
            name: String,
            value: String
        });
        return schema;
    }

    return schema;
}
