process.env.NODE_ENV = 'test';

var chai = require("chai");
var should = chai.should();
var chai_as_promised = require("chai-as-promised");
chai.use(chai_as_promised);

var mongoose = require("mongoose");
mongoose.Promise = global.Promise;

var db = require("../serios/core/storage/types/mongodb");
var settings = require("../settings").storage;
settings.location = "mongodb://localhost/serios-test";

describe('mongoose', function () {
    describe('.addServiceObject()', function () {
        var so =
        {
            "name": "Smart Home 1 Weather Sensors",
            "description": "This Service Object holds all weather related sensors of Smart Home 1.",
            "public": "true",
            "streams": {
                "weatherboard": {
                    "name": "Weatherboard",
                    "description": "The sensor that measures temperature, density and brightness of the Smart Home.",
                    "channels": {
                        "temperature1": {
                            "name": "Temperature Sensor outside the house",
                            "type": "Number",
                            "unit": "Grad Celsius"
                        },
                        "temperature2": {
                            "name": "Temperature Sensor inside the house",
                            "type": "Number",
                            "unit": "Grad Celsius"
                        },
                        "density": {
                            "name": "Density Sensor in the bathroom",
                            "type": "Number",
                            "unit": "Relative Density"
                        },
                        "brightness": {
                            "name": "Brightness Sensor in the bedroom.",
                            "type": "Number",
                            "unit": "Lux"
                        }
                    }
                },
                "location": {
                    "name": "Location Sensor",
                    "description": "The sensor that measures the location of the Smart Home.",
                    "channels": {
                        "latitude": {
                            "name": "Latitude of the Smart Home",
                            "type": "Number",
                            "unit": "Degrees"
                        },
                        "longitude": {
                            "name": "Longitude of the Smart Home",
                            "type": "Number",
                            "unit": "Degrees"
                        }
                    }
                }
            },
            "gateway": {
                "gatewayID": "",
                "name": "Smart Home 1",
                "URL": "url.to.the.gateway"
            }
        };
        it("Should successfully save service object", function () {
            return db.addServiceObject(so).fulfilled;
        });

        it("Should reject saving due to bad syntax", function () {
            return db.addServiceObject(so).rejected;
        });
    });

    describe('.updateServiceObject()', function () {
        it("Should successfully update service object", function () {
            var soID = "";
            var so = {};

            return db.updateServiceObject(soID, so).fulfilled;
        });

        it("Should reject updating due to bad syntax", function () {
            var soID = "";
            var so = {};

            return db.updateServiceObject(soID, so).rejected;
        });
    });

    describe('.removeServiceObject()', function () {
        it("Should successfully remove service object", function () {
            var soID = "";

            return db.removeServiceObject(soID).fulfilled;
        });

        it("Should reject removing due to missing service object", function () {
            var soID = "";

            return db.removeServiceObject(soID).rejected;
        });
    });

    describe('.getAllSoForGateway()', function () {
        it("Should successfully get all service objects for a gateway", function () {
            var gatewayID = "";

            return db.getAllSoForGateway(gatewayID).fulfilled;
        });

        it("Should reject request due to missing gateway", function () {
            var gatewayID = "";

            return db.getAllSoForGateway(gatewayID).rejected;
        });
    });

    describe('.getAllSoForUser()', function () {
        it("Should successfully get all service objects for a user", function () {
            var userID = "";

            return db.getAllSoForUser(userID).fulfilled;
        });

        it("Should reject request due to missing user", function () {
            var userID = "";

            return db.getAllSoForUser(userID).rejected;
        });
    });

    describe('.addGateway()', function () {
        it("Should successfully add gateway", function () {
            var gateway = {};

            return db.addGateway(gateway).fulfilled;
        });

        it("Should reject adding due to bad syntax", function () {
            var gateway = {};

            return db.addGateway(gateway).rejected;
        });
    });

    describe('.updateGateway()', function () {
        it("Should successfully update gateway", function () {
            var gatewayID = "";
            var gateway = {};

            return db.updateGateway(gatewayID, gateway).fulfilled;
        });

        it("Should reject updating request due to bad syntax", function () {
            var gatewayID = "";
            var gateway = {};

            return db.updateGateway(gatewayID, gateway).rejected;
        });
    });

    describe('.removeGateway()', function () {
        it("Should successfully remove gateway", function () {
            var gatewayID = {};

            return db.removeGateway(gatewayID).fulfilled;
        });

        it("Should reject remove request due to missing gateway", function () {
            var gatewayID = {};

            return db.removeGateway(gatewayID).rejected;
        });
    });

    describe('.getAllGatewaysForUser()', function () {
        it("Should successfully get all gateways for a user", function () {
            var userID = "";

            return db.getAllGatewaysForUser(userID).fulfilled;
        });

        it("Should reject request due to missing user", function () {
            var userID = "";

            return db.getAllGatewaysForUser(userID).rejected;
        });
    });

    describe('.addSensorData()', function () {
        it("Should successfully add sensor data", function () {
            var soID = "";
            var streamID = "";
            var sensordata = {};

            return db.addSensorData(soID, streamID, sensordata).fulfilled;
        });

        it("Should reject adding due to bad syntax", function () {
            var soID = "";
            var streamID = "";
            var sensordata = {};

            return db.addSensorData(soID, streamID, sensordata).rejected;
        });

        it("Should reject adding due to missing stream", function () {
            var soID = "";
            var streamID = "";
            var sensordata = {};

            return db.addSensorData(soID, streamID, sensordata).rejected;
        });
    });

    describe('.removeSensorData()', function () {
        it("Should successfully remove all sensor data for a stream", function () {
            var soID = "";
            var streamID = "";

            return db.removeSensorData(soID, streamID).fulfilled;
        });

        it("Should reject remove request due to missing stream", function () {
            var soID = "";
            var streamID = "";

            return db.removeSensorData(soID, streamID).rejected;
        });
    });

    describe('.getAllSensorDataForStream', function () {
        it("Should successfully get all sensor data for a stream", function () {
            var soID = "";
            var streamID = "";

            return db.getAllSensorDataForStream(soID, streamID).fulfilled;
        });

        it("Should reject get request due to missing sensor data", function () {
            var soID = "";
            var streamID = "";

            return db.getAllSensorDataForStream(soID, streamID).rejected;
        });

        it("Should reject get request due to missing stream", function () {
            var soID = "";
            var streamID = "";

            return db.getAllSensorDataForStream(soID, streamID).rejected;
        });
    });
});

before(function (done) {
    db.init(settings);
    done();
});

after(function (done) {
    mongoose.disconnect();
    done();
});

