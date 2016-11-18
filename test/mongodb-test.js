/**
 * This test file tests the majority of the database functionality
 * defined in the mongodb database implementation using `mongoose`.
 *
 * The tested file can be found at:
 * "serios/core/storage/types/mongodb/index.js".
 *
 * The tests are implemented using `mocha` and its assertion library `chai`.
 * Most tests are implemented asynchronously using `chai-as-promised` as promise assertion library.
 */

process.env.NODE_ENV = "test";

var chai = require("chai");
var should = chai.should();
var expect = chai.expect;
chai.use(require("chai-as-promised"));
var clone = require("clone");
var uuid = require("node-uuid");

var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
var models = require("../serios/core/storage/types/mongodb/models");

var db = require("../serios/core/storage/types/mongodb");
var settings = clone(require("../settings").storage);
settings.location = "mongodb://localhost:27017/serios-testserver";

describe("mongoose", function () {
    this.timeout(1000);

    var ownerID = uuid.v4();
    var so = {
        name: "Smart Home 1 Weather Sensors",
        description: "This Service Object holds all weather related sensors of Smart Home 1.",
        public: true,
        streams: [
            {
                name: "Weatherboard",
                description: "The sensor that measures temperature, humidity and brightness of the Smart Home.",
                channels: [
                    {
                        name: "Temperature Sensor outside the house",
                        type: "Number",
                        unit: "Grad Celsius"
                    },
                    {
                        name: "Temperature Sensor inside the house",
                        type: "Number",
                        unit: "Grad Celsius"
                    },
                    {
                        name: "Humidity Sensor in the bathroom",
                        type: "Number",
                        unit: "Relative Humidity"
                    },
                    {
                        name: "Brightness Sensor in the bedroom.",
                        type: "Number",
                        unit: "Lux"
                    }
                ]
            },
            {
                name: "Location Sensor",
                description: "The sensor that measures the location of the Smart Home.",
                channels: [
                    {
                        name: "Latitude of the Smart Home",
                        type: "Number",
                        unit: "Degrees"
                    },
                    {
                        name: "Longitude of the Smart Home",
                        type: "Number",
                        unit: "Degrees"
                    }
                ]
            }
        ],
        ownerID: ownerID,
        gateway: {
            gatewayID: undefined,
            name: "Smart Home 1",
            URL: "https://gateway_test.com/dir/to/my/gateway/"
        }
    };
    var so2 = {
        name: "Smart Home 2 Weather Sensors",
        description: "This Service Object holds all weather related sensors of Smart Home 2.",
        public: true,
        streams: [
            {
                name: "Weatherboard",
                description: "The sensor that measures temperature, density and brightness of the Smart Home.",
                channels: [
                    {
                        name: "Temperature Sensor outside the house",
                        type: "Number",
                        unit: "Grad Celsius"
                    }
                ]
            },
            {
                name: "Location Sensor",
                description: "The sensor that measures the location of the Smart Home.",
                channels: [
                    {
                        name: "Latitude of the Smart Home",
                        type: "Number",
                        unit: "Degrees"
                    },
                    {
                        name: "Longitude of the Smart Home",
                        type: "Number",
                        unit: "Degrees"
                    }
                ]
            }
        ],
        ownerID: ownerID,
        gateway: {
            gatewayID: undefined,
            name: "Smart Home 1",
            URL: "https://gateway_test.com/dir/to/my/gateway/"
        }
    };

    var soWithoutGateway = clone(so);
    delete soWithoutGateway.gateway;
    var soWithoutGateway2 = clone(so2);
    delete soWithoutGateway2.gateway;
    var gateway = {
        ownerID: ownerID,
        name: "Smart Home 1",
        URL: "https://gateway_test.com/dir/to/my/gateway/",
        port: 443,
        protocol: "HTTPS"
    };

    describe("Service Objects", function () {
        var badSyntaxSO = {
            name: "badSyntaxSO",
            description: "Missing ownerID, public and streams attributes",
            gateway: {
                name: "gateway1",
                URL: "url.to.the.gateway"
            }
        };
        var badGatewayIdSO = {
            name: "Service Object with wrong gatewayID",
            description: "This Service Object should not be saved due to wrong gatewayID information.",
            public: "true",
            streams: [
                {
                    name: "Weatherboard",
                    description: "The sensor that measures temperature, density and brightness of the Smart Home.",
                    channels: [
                        {
                            name: "Temperature Sensor outside the house",
                            type: "Number",
                            unit: "Grad Celsius"
                        }
                    ]
                }
            ],
            ownerID: ownerID,
            gateway: {
                gatewayID: "this_is_not_a_gateway_id"
            }
        };
        var badGatewayNameURLSO = {
            name: "Service Object with wrong Gateway Name and URL information",
            description: "This Service Object should not be saved due to wrong name and url information.",
            public: "true",
            streams: {
                weatherboard: {
                    name: "Weatherboard",
                    description: "The sensor that measures temperature, density and brightness of the Smart Home.",
                    channels: {
                        temperature1: {
                            name: "Temperature Sensor outside the house",
                            type: "Number",
                            unit: "Grad Celsius"
                        }
                    }
                }
            },
            ownerID: ownerID,
            gateway: {
                name: "WRONGNAME",
                URL: "url.wr.ong"
            }
        };

        describe(".addServiceObject()", function () {
            var soID;

            describe("Add for correct GatewayID", function () {
                var addSo = clone(so);
                var gID;
                before(function () {
                    return db.addGateway(gateway).then(function (id) {
                        gID = id;
                        addSo.gateway.gatewayID = gID;
                    }).should.be.fulfilled;
                });
                after(function () {
                    return db.removeGateway(gID).then(db.removeServiceObject(soID)).should.be.fulfilled;
                });

                it("Should successfully save service object with valid gateway id", function () {
                    return db.addServiceObject(addSo)
                        .then(function (res) {
                            soID = res.soID;
                            return db.getServiceObject(soID).then(function (foundSO) {
                                expect(foundSO.gatewayID).to.equal(gID);
                            });
                        }).should.be.fulfilled;
                });
            });

            describe("Add with gateway information", function () {
                var gID;

                after(function () {
                    return db.removeGateway(gID).then(db.removeServiceObject(soID)).should.be.fulfilled;
                });

                it("Should successfully save service object with new gateway information", function () {
                    return db.addServiceObject(so)
                        .then(function (res) {
                            soID = res.soID;
                            gID = res.gatewayID;
                            expect(soID).to.not.equal(undefined);
                            expect(gID).to.not.equal(undefined);
                        }).should.be.fulfilled;
                });
            });

            describe("Add without gateway information", function () {
                var soID;
                after(function () {
                    return db.removeServiceObject(soID).should.be.fulfilled;
                });

                it("Should successfully save service object without gateway information", function () {
                    var soWithOutGateway = clone(so);
                    delete soWithOutGateway.gateway;
                    return db.addServiceObject(soWithOutGateway)
                        .then(function (res) {
                            soID = res.soID;
                        }).should.be.fulfilled;
                });

            });

            it("Should reject saving due to missing attributes", function () {
                return db.addServiceObject(badSyntaxSO).should.be.rejectedWith(Error);
            });

            describe("Reject add due to wrong GatewayID", function () {
                var gID;
                before(function () {
                    return db.addGateway(gateway).then(function (id) {
                        gID = id;
                    }).should.be.fulfilled;
                });

                after(function () {
                    return db.removeGateway(gID).should.be.fulfilled;
                });

                it("Should reject saving due to wrong gatewayID", function () {
                    return db.addServiceObject(badGatewayIdSO).should.be.rejectedWith(Error);
                });
            });

            describe("Reject add due to wrong gateway name and URL for correct gatewayID", function () {
                var gID;
                before(function () {
                    return db.addGateway(gateway).then(function (id) {
                        gID = id;
                    }).should.be.fulfilled;
                });

                after(function () {
                    return db.removeGateway(gID).should.be.fulfilled;
                });
                it("Should reject saving due to wrong gateway name and URL for correct gatewayID", function () {
                    var badGW = clone(badGatewayNameURLSO);
                    badGW.gateway.gatewayID = gID;
                    return db.addServiceObject(badGW).should.be.rejectedWith(Error);
                });
            });
        });
        describe(".updateServiceObject()", function () {
            var soID;
            describe("Update service object", function () {
                before(function () {
                    return db.addServiceObject(soWithoutGateway).then(function (res) {
                        soID = res.soID;
                    }).should.be.fulfilled;
                });
                after(function () {
                    return db.removeServiceObject(soID).should.be.fulfilled;
                });

                it("Should successfully update service object", function () {
                    return db.updateServiceObject(soID, soWithoutGateway).then(function (updatedSO) {
                        expect(soID).to.equal(updatedSO._id);
                        expect(soWithoutGateway.name).to.deep.equal(updatedSO.name);
                        expect(soWithoutGateway.description).to.deep.equal(updatedSO.description);
                        expect(soWithoutGateway.streams.length).to.equal(updatedSO.streams.length);
                    }).should.be.fulfilled;
                });

            });

            describe("Update Gateway information when updating service object", function () {
                var soID;
                var gID;
                var newSo = clone(so);
                before(function () {
                    return db.addGateway(gateway).then(function (id) {
                        gID = id;
                        newSo.gateway.gatewayID = gID;
                        return db.addServiceObject(soWithoutGateway);
                    }).then(function (res) {
                        soID = res.soID;
                    }).should.be.fulfilled;
                });

                after(function () {
                    return db.getServiceObject(soID).then(function (foundSo) {
                        expect(foundSo).to.not.equal(undefined);
                        expect(foundSo.gatewayID).to.equal(gID);
                        return db.removeGateway(gID)
                    }).then(db.removeServiceObject(soID)).should.be.fulfilled;
                });

                it("Should successfully update gateway information when updating service object", function () {
                    return db.updateServiceObject(soID, newSo).then(function (res) {
                        expect(soID).to.equal(res.soID);
                        expect(gID).to.equal(res.gatewayID);
                    }).should.be.fulfilled;
                });
            });

            describe("Create Gateway when updating service objects", function () {
                var soID;
                var gID;
                before(function () {
                    return db.addServiceObject(soWithoutGateway).then(function (res) {
                        soID = res.soID;
                    }).should.be.fulfilled;
                });

                after(function () {
                    return db.removeGateway(gID).then(db.removeServiceObject(soID)).should.be.fulfilled;
                });

                it("Should successfully create gateway when updating service object", function () {
                    return db.updateServiceObject(soID, so).then(function (res) {
                        expect(res.gatewayID).to.not.equal(undefined);
                        gID = res.gatewayID;
                    }).should.be.fulfilled;
                });
            });

            describe("Reject updating due missing attributes", function () {
                var soID;
                var gID;

                before(function () {
                    return db.addServiceObject(so).then(function (res) {
                        soID = res.soID;
                        gID = res.gatewayID;
                    }).should.be.fulfilled;
                });

                after(function () {
                    return db.removeGateway(gID).then(db.removeServiceObject(soID)).should.be.fulfilled;
                });

                it("Should reject updating due to bad syntax", function () {
                    return db.updateServiceObject(soID, badSyntaxSO).should.be.rejectedWith(Error);
                });

                it("Should reject saving due to wrong gatewayID", function () {
                    return db.updateServiceObject(soID, badGatewayIdSO).should.be.rejected;
                });
            });

        });

        describe(".getServiceObject()", function () {
            var soID;

            before(function () {
                return db.addServiceObject(so).then(function (res) {
                    soID = res.soID;
                }).should.be.fulfilled;
            });

            after(function () {
                return db.removeServiceObject(soID).should.be.fulfilled;
            });

            it("Should successfully get Service Object", function () {
                return db.getServiceObject(soID).then(function (foundSO) {
                    expect(foundSO.name).to.equal(so.name);
                    expect(foundSO.description).to.equal(so.description);
                    expect(foundSO.streams.length).to.equal(so.streams.length);
                }).should.be.fulfilled;
            });

            it("Should reject get request due to missing service object", function () {
                return db.getServiceObject("missing_service_object").should.be.rejected;
            });
        });

        describe(".removeServiceObject()", function () {
            var soID;
            beforeEach(function () {
                return db.addServiceObject(soWithoutGateway).then(function (res) {
                    soID = res.soID;
                }).should.be.fulfilled;
            });

            it("Should successfully remove service object", function () {
                return db.removeServiceObject(soID).should.be.fulfilled;
            });

            describe("Reject service object remove due to missing service object", function () {
                after(function () {
                    return db.removeServiceObject(soID).should.be.fulfilled;
                });

                it("Should reject removing due to missing service object", function () {
                    return db.removeServiceObject("wrong_id").should.be.rejected;
                });
            });
        });

        describe(".getAllSoForGateway()", function () {
            var gatewayID;
            var soID1, soID2;
            before(function () {
                var gatewaySO1 = clone(so);
                var gatewaySO2 = clone(so2);
                return db.addGateway(gateway).then(function (gID) {
                    gatewayID = gID;
                    gatewaySO1.gateway.gatewayID = gatewayID;
                    gatewaySO2.gateway.gatewayID = gatewayID;
                    return db.addServiceObject(gatewaySO1);
                }).then(function (res) {
                    soID1 = res.soID;
                    return db.addServiceObject(gatewaySO2);
                }).then(function (res) {
                    soID2 = res.soID;
                }).should.be.fulfilled;
            });
            after(function () {
                return db.removeGateway(gatewayID)
                    .then(db.removeServiceObject(soID1))
                    .then(db.removeServiceObject(soID2)).should.be.fulfilled;
            });

            it("Should successfully get all service objects for a gateway", function () {
                return db.getAllSoForGateway(gatewayID).then(function (SOs) {
                    expect([soID1, soID2]).to.deep.equal(SOs);
                }).should.be.fulfilled;
            });

            it("Should reject request due to missing gateway", function () {
                return db.getAllSoForGateway("missing_gateway").should.be.rejected;
            });
        });

        describe(".getAllSoForUser()", function () {
            var soID1, soID2;
            before(function () {
                var gatewaySO = clone(soWithoutGateway);
                var gatewaySO2 = clone(soWithoutGateway2);
                return db.addServiceObject(gatewaySO).then(function (res) {
                    soID1 = res.soID;
                    return db.addServiceObject(gatewaySO2);
                }).then(function (res) {
                    soID2 = res.soID;
                }).should.be.fulfilled;
            });

            after(function () {
                return db.removeServiceObject(soID1)
                    .then(db.removeServiceObject(soID2)).should.be.fulfilled;
            });

            it("Should successfully get all service objects for a user", function () {
                return db.getAllSoForUser(ownerID)
                    .then(function (SOs) {
                        expect([soID1, soID2]).to.deep.equal(SOs);
                    }).should.be.fulfilled;
            });

            it("Should reject request due to missing user", function () {
                return db.getAllSoForUser("missing_user").should.be.rejected;
            });
        });
    });


    describe("Gateways", function () {
        var gatewayID;
        var badUserSyntaxGateway = {
            name: "Test Gateway1",
            URL: "url.to.this.gateway"
        };

        describe(".addGateway()", function () {
            var gatewayID;

            describe("Successful gateway add", function () {
                after(function () {
                    return db.removeGateway(gatewayID).should.be.fulfilled;
                });

                it("Should successfully add gateway", function () {
                    return db.addGateway(gateway)
                        .then(function (gID) {
                            gatewayID = gID;
                        }).should.be.fulfilled;
                });
            });

            it("Should reject adding due to missing user", function () {
                return db.addGateway(badUserSyntaxGateway).should.be.rejectedWith(Error);
            });
        });

        describe(".updateGateway()", function () {
            beforeEach(function () {
                return db.addGateway(gateway).then(function (gID) {
                    gatewayID = gID;
                }).should.be.fulfilled;
            });

            afterEach(function () {
                return db.removeGateway(gatewayID).should.be.fulfilled;
            });

            it("Should successfully update gateway", function () {
                return db.updateGateway(gatewayID, gateway).should.be.fulfilled;
            });

            it("Should successfully update gateway even though user information is missing", function () {
                return db.updateGateway(gatewayID, badUserSyntaxGateway).should.be.fulfilled;
            });

            it("Should reject updating request due to not finding gateway ID", function () {
                return db.updateGateway("wrong_id", gateway).should.be.rejected;
            });
        });

        describe(".removeGateway()", function () {
            describe("Remove gateway normally", function () {
                var gID;
                before(function () {
                    return db.addGateway(gateway).then(function (id) {
                        gID = id;
                    }).should.be.fulfilled;
                });

                it("Should successfully remove gateway", function () {
                    return db.removeGateway(gID).should.be.fulfilled;
                });

            });

            describe("Remove wrong gateway", function () {
                var gID;
                before(function () {
                    return db.addGateway(gateway).then(function (id) {
                        gID = id;
                    }).should.be.fulfilled;
                });

                after(function () {
                    return db.removeGateway(gID).should.be.fulfilled;
                });

                it("Should reject remove request due to missing gateway", function () {
                    return db.removeGateway("wrong_gatewayID").should.be.rejected;
                });
            });

            describe("Remove gateway but still return its former service objects", function () {
                var gID;
                var soID;
                before(function () {
                    var addedSo = clone(so);
                    return db.addGateway(gateway).then(function (id) {
                        gID = id;
                        addedSo.gateway.gatewayID = gID;
                        return db.addServiceObject(addedSo);
                    }).then(function (res) {
                        soID = res.soID;
                    }).should.be.fulfilled;
                });

                after(function () {
                    return db.removeServiceObject(soID).should.be.fulfilled;
                });

                it("Should successfully remove gateway but still return service objects", function () {
                    var foundSO1;
                    var foundSO2;
                    return db.getServiceObject(soID)
                        .then(function (foundSO) {
                            foundSO1 = foundSO;
                            return db.removeGateway(gID);
                        }).then(function () {
                            return db.getServiceObject(soID);
                        }).then(function (foundSO) {
                            foundSO2 = foundSO;
                            expect(foundSO).to.not.equal(undefined);
                            expect(foundSO.gatewayID).to.equal(null);
                            expect(foundSO2.gatewayID).to.not.equal(foundSO1);
                        }).should.be.fulfilled;
                });
            });
        });

        describe(".getAllGatewaysForUser()", function () {
            var gatewayID2;
            beforeEach(function () {
                var gateway2 = clone(gateway);
                gateway2.URL = "url.to.another.gateway";

                return db.addGateway(gateway).then(function (gID) {
                    gatewayID = gID;
                    return db.addGateway(gateway2);
                }).then(function (gID) {
                    gatewayID2 = gID;
                }).should.be.fulfilled;
            });

            afterEach(function () {
                return db.removeGateway(gatewayID)
                    .then(db.removeGateway(gatewayID2))
                    .should.be.fulfilled;
            });

            it("Should successfully get all gateways for a user", function () {
                return db.getAllGatewaysForUser(ownerID).then(function (gateways) {
                    expect(gateways.length).to.not.equal(0);
                    expect(gateways[0]).to.not.equal(gateways[1]);
                }).should.be.fulfilled;
            });

            it("Should reject request due to gateways for given user", function () {
                return db.getAllGatewaysForUser("wrong_user").should.be.rejected;
            });
        });
    });

    describe("Sensor Data", function () {
        var sensordata = {
            ownerID: ownerID,
            channels: [
                {
                    name: "temperature1",
                    value: "10.2"
                },
                {
                    name: "temperature2",
                    value: "20.8"
                },
                {
                    name: "humidity",
                    value: "63"
                },
                {
                    name: "brightness",
                    value: "970"
                }
            ]
        };
        var sensordata2 = clone(sensordata);
        sensordata2.channels[3].value = 10000;

        var badSyntaxSensorData = {
            ownerID: ownerID,
            channels: [
                {
                    name: "temperature1"
                },
                {
                    name: "temperature2",
                    value: "20.8"
                },
                {
                    name: "humidity",
                    value: "63"
                },
                {
                    value: "970"
                }
            ]
        };

        describe(".addSensorData()", function () {
            var soID;
            var gID;
            var streamID = "Weatherboard";

            before(function () {
                return db.addServiceObject(so).then(function (res) {
                    soID = res.soID;
                    gID = res.gatewayID;
                    return db.getServiceObject(soID);
                }).should.be.fulfilled;
            });

            after(function () {
                return db.removeServiceObject(soID).then(db.removeGateway(gID)).should.be.fulfilled;
            });

            it("Should successfully add sensor data", function () {
                return db.addSensorData(soID, streamID, sensordata).should.be.fulfilled;
            });

            it("Should reject adding due to bad syntax", function () {
                return db.addSensorData(soID, streamID, badSyntaxSensorData).should.be.rejectedWith(Error);
            });

            it("Should reject adding due to missing stream", function () {
                return db.addSensorData(soID, "missing_stream", sensordata).should.be.rejectedWith(Error);
            });

            it("Should reject adding due to ownerID", function () {
                var sensorDataWithoutOwner = clone(sensordata);
                delete sensorDataWithoutOwner.ownerID;
                return db.addSensorData(soID, streamID, sensorDataWithoutOwner).should.be.rejectedWith(Error);
            });
        });

        describe(".removeSensorData()", function () {
            var soID;
            var gID;
            var streamID = "Weatherboard";
            before(function () {
                return db.addServiceObject(so).then(function (res) {
                    soID = res.soID;
                    gID = res.gatewayID;
                    return db.addSensorData(soID, streamID, sensordata);
                }).then(function () {
                    return db.addSensorData(soID, streamID, sensordata2)
                }).should.be.fulfilled;
            });

            after(function () {
                return db.removeServiceObject(soID).then(db.removeGateway(gID)).should.be.fulfilled;
            });

            it("Should successfully remove all sensor data for a stream", function () {
                return db.removeSensorData(soID, streamID).should.be.fulfilled;
            });

            it("Should reject remove request due to missing stream", function () {
                return db.removeSensorData(soID, "missing_weatherboard").should.be.rejectedWith(Error);
            });

            it("Should reject remove request due to missing sensor data", function () {
                return db.removeSensorData(soID, streamID).should.be.rejectedWith(Error);
            });
        });

        describe(".getAllSensorDataForStream", function () {
            describe("Get all Sensor data for a stream", function () {
                var soID;
                var gID;
                var streamID = "Weatherboard";
                before(function () {
                    return db.addServiceObject(so).then(function (res) {
                        soID = res.soID;
                        gID = res.gatewayID;
                        return db.addSensorData(soID, streamID, sensordata);
                    }).then(function () {
                        return db.addSensorData(soID, streamID, sensordata2)
                    }).should.be.fulfilled;
                });

                after(function () {
                    return db.removeGateway(gID)
                        .then(function () {
                            return db.removeSensorData(soID, streamID)
                        }).then(function () {
                            return db.removeServiceObject(soID)
                        }).should.be.fulfilled;
                });

                it("Should successfully get all sensor data for a stream", function () {
                    return db.getAllSensorDataForStream(soID, streamID).then(function (data) {
                        expect(data[0].channels[3]).to.not.equal(data[1].channels[3]);
                        expect(data[0].channels[0].value).to.equal(data[1].channels[0].value);
                    }).should.be.fulfilled;
                });
            });

            describe("Reject Sensor Data requests", function () {
                var soID;
                var gID;
                var streamID = "Weatherboard";
                before(function () {
                    return db.addServiceObject(so).then(function (res) {
                        soID = res.soID;
                        gID = res.gatewayID;
                        return db.getServiceObject(soID);
                    }).should.be.fulfilled;
                });

                after(function () {
                    return db.removeGateway(gID).then(db.removeServiceObject(soID)).should.be.fulfilled;
                });

                it("Should reject get request due to missing sensor data", function () {
                    return db.getAllSensorDataForStream(soID, streamID).should.be.rejected;
                });

                it("Should reject get request due to missing stream", function () {
                    return db.getAllSensorDataForStream(soID, "missing_weatherboard").should.be.rejected;
                });
            });
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

