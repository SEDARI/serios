process.env.NODE_ENV = 'test';

var chai = require("chai");
var assert = chai.assert;
var should = chai.should();

var mongoose = require("mongoose");

var db = require("../serios/core/storage/types/mongodb/index");
var settings = require("../settings").storage.mongodb;

var ServiceObject = require("../serios/core/storage/types/mongodb/models").ServiceObject;
var Gateway = require("../serios/core/storage/types/mongodb/models").Gateway;
var SensorData = require("../serios/core/storage/types/mongodb/models").SensorData;

describe('mongoose', function () {
    describe('.addServiceObject()', function () {
        it("Should successfully save service object", function () {
            var so = ServiceObject({
                name: "test123",
                description: "test234",
                streams: {}
            });

            return db.addServiceObject(so).should.be.fulfilled;
        });

        it("Should reject saving due to bad syntax", function () {
            var so = ServiceObject({
                name: "test123",
                description: "test234",
                streams: {}
            });
            return db.addServiceObject(so).should.be.rejected;
        });
    });

    describe('.updateServiceObject()', function () {
        it("Should successfully update service object", function () {
            var soID = "";
            var so = ServiceObject({});

            return db.updateServiceObject(soID, so).should.be.fulfilled;
        });

        it("Should reject updating due to bad syntax", function () {
            var soID = "";
            var so = ServiceObject({});

            return db.updateServiceObject(soID, so).should.be.rejected;
        });
    });

    describe('.removeServiceObject()', function () {
        it("Should successfully remove service object", function () {
            var soID = "";

            return db.removeServiceObject(soID).should.be.fulfilled;
        });

        it("Should reject removing due to missing service object", function () {
            var soID = "";

            return db.removeServiceObject(soID).should.be.rejected;
        });
    });

    describe('.getAllSoForGateway()', function () {
        it("Should successfully get all service objects for a gateway", function () {
            var gatewayID = "";

            return db.getAllSoForGateway(gatewayID).should.be.fulfilled;
        });

        it("Should reject request due to missing gateway", function () {
            var gatewayID = "";

            return db.getAllSoForGateway(gatewayID).should.be.rejected;
        });
    });

    describe('.getAllSoForUser()', function () {
        it("Should successfully get all service objects for a user", function () {
            var userID = "";

            return db.getAllSoForUser(userID).should.be.fulfilled;
        });

        it("Should reject request due to missing user", function () {
            var userID = "";

            return db.getAllSoForUser(userID).should.be.rejected;
        });
    });

    describe('.addGateway()', function () {
        it("Should successfully add gateway", function () {
            var gateway = {};

            return db.addGateway(gateway).should.be.fulfilled;
        });

        it("Should reject adding due to bad syntax", function () {
            var gateway = {};

            return db.addGateway(gateway).should.be.rejected;
        });
    });

    describe('.updateGateway()', function () {
        it("Should successfully update gateway", function () {
            var gatewayID = "";
            var gateway = {};

            return db.updateGateway(gatewayID, gateway).should.be.fulfilled;
        });

        it("Should reject updating request due to bad syntax", function () {
            var gatewayID = "";
            var gateway = {};

            return db.updateGateway(gatewayID, gateway).should.be.rejected;
        });
    });

    describe('.removeGateway()', function () {
        it("Should successfully remove gateway", function () {
            var gatewayID = {};

            return db.removeGateway(gatewayID).should.be.fulfilled;
        });

        it("Should reject remove request due to missing gateway", function () {
            var gatewayID = {};

            return db.removeGateway(gatewayID).should.be.rejected;
        });
    });

    describe('.getAllGatewaysForUser()', function () {
        it("Should successfully get all gateways for a user", function () {
            var userID = "";

            return db.getAllGatewaysForUser(userID).should.be.fulfilled;
        });

        it("Should reject request due to missing user", function () {
            var userID = "";

            return db.getAllGatewaysForUser(userID).should.be.rejected;
        });
    });

    describe('.addSensorData()', function () {
        it("Should successfully add sensor data", function () {
            var soID = "";
            var streamID = "";
            var sensordata = {};

            return db.addSensorData(soID, streamID, sensordata).should.be.fulfilled;
        });

        it("Should reject adding due to bad syntax", function () {
            var soID = "";
            var streamID = "";
            var sensordata = {};

            return db.addSensorData(soID, streamID, sensordata).should.be.rejected;
        });

        it("Should reject adding due to missing stream", function () {
            var soID = "";
            var streamID = "";
            var sensordata = {};

            return db.addSensorData(soID, streamID, sensordata).should.be.rejected;
        });
    });

    describe('.removeSensorData()', function () {
        it("Should successfully remove all sensor data for a stream", function () {
            var soID = "";
            var streamID = "";

            return db.removeSensorData(soID, streamID).should.be.fulfilled;
        });

        it("Should reject remove request due to missing stream", function () {
            var soID = "";
            var streamID = "";

            return db.removeSensorData(soID, streamID).should.be.rejected;
        });
    });

    describe('.getAllSensorDataForStream', function () {
        it("Should successfully get all sensor data for a stream", function () {
            var soID = "";
            var streamID = "";

            return db.getAllSensorDataForStream(so, streamID).fulfilled;
        });

        it("Should reject get request due to missing sensor data", function () {
            var soID = "";
            var streamID = "";

            return db.getAllSensorDataForStream(so, streamID).rejected;
        });

        it("Should reject get request due to missing stream", function () {
            var soID = "";
            var streamID = "";

            return db.getAllSensorDataForStream(so, streamID).rejected;
        });
    });
});

beforeEach(function (done) {
    // 0 == disconnected
    if (mongoose.connection.readyState == 0) {
        mongoose.connect("mongodb://localhost/serios-test", function (err) {
            if (err) {
                done(err);
            }
            return clearDatabase();
        });
    }

    function clearDatabase() {
        for (var i in mongoose.connection.collections) {
            mongoose.connection.collections[i].remove(function () {
            });
        }
        return done;
    }
});

afterEach(function (done) {
    mongoose.disconnect();
    return done();
});

