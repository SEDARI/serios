process.env.NODE_ENV = 'test';

var http = require("http");
var express = require("express");
var app = express();

var chai = require("chai");
var should = chai.should();
var expect = chai.expect;

chai.use(require("chai-http"));
chai.use(require("chai-as-promised"));

var clone = require("clone");
var uuid = require("uuid");

var mongoose = require("mongoose");

var serios = require("../serios/serios.js");
var core = require("../serios/core");
var settings = require("../settings");
var server = null;
var url_prefix = "/api";

before(function (done) {
    settings.storage.location = "mongodb://localhost/serios-testserver";
    server = http.createServer(function (req, res) {
        app(req, res);
    });
    serios.init(server, settings);
    app.use("/", serios.app);
    serios.start();

    done();
});

after(function (done) {
    server.close();
    serios.stop();
    done();
});

describe("API", function () {
    this.timeout(2000);
    var userID = uuid();

    /*
     * The following objects will be used in the whole test cases.
     */
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
                        name: "temperate1",
                        type: "Number",
                        unit: "Grad Celsius"
                    },
                    {
                        name: "temperate2",
                        type: "Number",
                        unit: "Grad Celsius"
                    },
                    {
                        name: "humidity",
                        type: "Number",
                        unit: "Relative Humidity"
                    },
                    {
                        name: "brightness",
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
                        name: "latitude",
                        type: "Number",
                        unit: "Degrees"
                    },
                    {
                        name: "longitude",
                        type: "Number",
                        unit: "Degrees"
                    }
                ]
            }
        ],
        gateway: {
            name: "Smart Home 1",
            URL: "https://gateway_test.com/dir/to/my/gateway/"
        }
    };

    var gateway = {
        "name": "Smart Home 1",
        "URL": "https://gateway_test.com/dir/to/my/gateway/",
        "port": 443,
        "protocol": "HTTPS"
    };

    var soWithoutGateway = clone(so);
    delete soWithoutGateway.gateway;

    describe("Service Objects", function () {

        var badSyntaxSO = {
            name: "badSyntaxSO",
            description: "Missing public and streams attributes",
            gateway: {
                name: "gateway1",
                URL: "url.to.the.gateway"
            }
        };

        describe('add ServiceObject', function () {
            // TODO Phil 21/11/16: add gateway with adding service object
            var soID;
            var gID;
            afterEach(function () {
                return Promise.resolve()
                    .then(function () {
                        if (soID) {
                            return chai.request(app)
                                .del(url_prefix + "/" + soID)
                                .set("Authorization", userID)
                                .then(function (res) {
                                    expect(res.status).to.equal(200);
                                });
                        }
                    }).then(function () {
                        if (gID) {
                            return chai.request(app)
                                .del(url_prefix + "/gateway/" + gID)
                                .set("Authorization", userID)
                                .then(function (res) {
                                    expect(res.status).to.equal(200);
                                });
                        }
                    });
            });

            it("Should accept a serving object successfully", function () {
                return chai.request(app)
                    .post(url_prefix + "/")
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(soWithoutGateway)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                        expect(res.body).to.have.property("soID");
                        soID = res.body.soID;
                        gID = null;
                    });
            });

            it("Should accept a service object that adds a gateway successfully", function () {
                return chai.request(app)
                    .post(url_prefix + "/")
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(so)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                        expect(res.body).to.have.property("soID");
                        expect(res.body).to.have.property("gatewayID");
                        soID = res.body.soID;
                        gID = res.body.gatewayID;
                    });
            });

            it("Should reject a service object due to bad syntax", function () {
                return chai.request(app)
                    .post(url_prefix + "/")
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(badSyntaxSO)
                    .catch(function (res) {
                        expect(res.status).to.equal(400);
                        soID = null;
                        gID = null;
                    });
            });

            it("Should reject a service object due to missing authentication", function () {
                return chai.request(app)
                    .post(url_prefix + "/")
                    .set("Content-Type", "application/json")
                    .send(so)
                    .catch(function (res) {
                        expect(res.status).to.equal(403);
                        soID = null;
                        gID = null;
                    });
            });
        });

        describe('get ServiceObject', function () {
            var soID;
            before(function () {
                return chai.request(app)
                    .post(url_prefix + "/")
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(soWithoutGateway)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                        expect(res.body).to.have.property("soID");
                        soID = res.body.soID;
                    });
            });

            after(function () {
                return chai.request(app)
                    .del(url_prefix + "/" + soID)
                    .set("Authorization", userID)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                    });
            });

            it("Should accept request and get ServiceObject successfully", function () {
                    return chai.request(app)
                        .get(url_prefix + "/" + soID)
                        .set("Authorization", userID)
                        .then(function (res) {
                            expect(res.status).to.equal(200);
                            expect(res.body).to.have.property("name");
                            expect(res.body).to.have.property("description");
                            expect(res.body).to.have.property("streams");
                        });
                }
            );

            it("Should reject request as the service object was not found", function () {
                return chai.request(app)
                    .get(url_prefix + "/" + "wrong_soID")
                    .set("Authorization", userID)
                    .catch(function (res) {
                        expect(res.status).to.equal(400);
                    });
            });

            it("Should reject request due to missing authentication", function () {
                return chai.request(app)
                    .get(url_prefix + "/" + soID)
                    .catch(function (res) {
                        expect(res.status).to.equal(403);
                    });
            });
        });

        describe('update ServiceObject', function () {
            var soID;

            var updatedSo = clone(soWithoutGateway);
            updatedSo.name = "Updated Service Object Name";
            updatedSo.description = "Updated Service Object Description";

            // TODO Phil 21/11/16: update service object and create gateway
            before(function () {
                return chai.request(app)
                    .post(url_prefix + "/")
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(soWithoutGateway)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                        expect(res.body).to.have.property("soID");
                        soID = res.body.soID;
                    });
            });
            after(function () {
                return chai.request(app)
                    .del(url_prefix + "/" + soID)
                    .set("Authorization", userID)
                    .then(function (res) {
                        expect(res.status).to.equal(200);

                    });
            });

            it("Should update a service object successfully", function () {
                return chai.request(app)
                    .put(url_prefix + "/" + soID)
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(updatedSo)
                    .then(function (res) {
                        expect(res.status).to.equal(200);

                    });
            });

            it("Should reject updating service object due to wrong id", function () {
                return chai.request(app)
                    .put(url_prefix + "/" + "This_cannot_be_an_id")
                    .set("Authorization", userID)
                    .send(updatedSo)
                    .catch(function (res) {
                        expect(res.status).to.equal(400);

                    });
            });

            it("Should reject updating service object due missing authentication", function () {
                return chai.request(app)
                    .put(url_prefix + "/" + soID)
                    .send(updatedSo)
                    .catch(function (res) {
                        expect(res.status).to.equal(403);

                    });
            });
        });

        describe('remove ServiceObject', function () {
            var soID;

            beforeEach(function () {
                return chai.request(app)
                    .post(url_prefix + "/")
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(soWithoutGateway)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                        expect(res.body).to.have.property("soID");
                        soID = res.body.soID;
                    });
            });
            afterEach(function () {
                if (soID) {
                    return chai.request(app)
                        .del(url_prefix + "/" + soID)
                        .set("Authorization", userID)
                        .then(function (res) {
                            expect(res.status).to.equal(200);
                        });
                }
            });

            it("Should remove a service object successfully", function () {
                return chai.request(app)
                    .del(url_prefix + "/" + soID)
                    .set("Authorization", userID)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                        soID = null;
                    });
            });

            it("Should reject deleting service object due to wrong id", function () {
                return chai.request(app)
                    .del(url_prefix + "/" + "This_cannot_be_a_id")
                    .set("Authorization", userID)
                    .catch(function (res) {
                        expect(res.status).to.equal(400);
                    });
            });

            it("Should reject removing service object due missing authentication", function () {
                return chai.request(app)
                    .put(url_prefix + "/" + soID)
                    .catch(function (res) {
                        expect(res.status).to.equal(403);
                    });
            });
        });

        describe('Get all service objects for a user', function () {
            var soID1, soID2;

            before(function () {
                return Promise.resolve()
                    .then(function () {
                        return chai.request(app)
                            .post(url_prefix + "/")
                            .set("Authorization", userID)
                            .set("Content-Type", "application/json")
                            .send(soWithoutGateway)
                            .then(function (res) {
                                expect(res.status).to.equal(200);
                                expect(res.body).to.have.property("soID");
                                soID1 = res.body.soID;
                            });
                    }).then(function () {
                        return chai.request(app)
                            .post(url_prefix + "/")
                            .set("Authorization", userID)
                            .set("Content-Type", "application/json")
                            .send(soWithoutGateway)
                            .then(function (res) {
                                expect(res.status).to.equal(200);
                                expect(res.body).to.have.property("soID");
                                soID2 = res.body.soID;
                            });
                    });
            });
            after(function () {
                return Promise.resolve()
                    .then(function () {
                        return chai.request(app)
                            .del(url_prefix + "/" + soID1)
                            .set("Authorization", userID)
                            .then(function (res) {
                                expect(res.status).to.equal(200);
                            });
                    }).then(function () {
                        return chai.request(app)
                            .del(url_prefix + "/" + soID2)
                            .set("Authorization", userID)
                            .then(function (res) {
                                expect(res.status).to.equal(200);
                            });
                    });
            });

            it("Should get all service objects for a user successfully", function () {
                return chai.request(app)
                    .get(url_prefix + "/sos")
                    .set("Authorization", userID)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                        expect(res.body).to.deep.equal([soID1, soID2]);
                    });
            });

            it("Should reject service object due to missing authentication", function () {
                return chai.request(app)
                    .get(url_prefix + "/sos")
                    .catch(function (res) {
                        expect(res.status).to.equal(403);
                    });
            });
        });

        describe("Get all Service Object for Gateway", function () {
            describe("Get Service Object for Gateway", function () {
                var gID;
                var soID1, soID2;
                var soWithGateway = clone(so);

                before(function () {
                    return Promise.resolve()
                        .then(function () {
                            return chai.request(app)
                                .post(url_prefix + "/gateway")
                                .set("Authorization", userID)
                                .set("Content-Type", "application/json")
                                .send(gateway)
                                .then(function (res) {
                                    expect(res.status).to.equal(200);
                                    expect(res.body).to.have.property("gatewayID");
                                    gID = res.body.gatewayID;
                                    soWithGateway.gateway = {
                                        gatewayID: gID
                                    };
                                });
                        }).then(function () {
                            return chai.request(app)
                                .post(url_prefix + "/")
                                .set("Authorization", userID)
                                .set("Content-Type", "application/json")
                                .send(soWithGateway)
                                .then(function (res) {
                                    expect(res.status).to.equal(200);
                                    expect(res.body).to.have.property("soID");
                                    soID1 = res.body.soID;
                                });
                        }).then(function () {
                            return chai.request(app)
                                .post(url_prefix + "/")
                                .set("Authorization", userID)
                                .set("Content-Type", "application/json")
                                .send(soWithGateway)
                                .then(function (res) {
                                    expect(res.status).to.equal(200);
                                    expect(res.body).to.have.property("soID");
                                    soID2 = res.body.soID;
                                });
                        });
                });
                after(function () {
                    return Promise.resolve()
                        .then(function () {
                            return chai.request(app)
                                .del(url_prefix + "/" + soID1)
                                .set("Authorization", userID)
                                .then(function (res) {
                                    expect(res.status).to.equal(200);
                                });
                        }).then(function () {
                            return chai.request(app)
                                .del(url_prefix + "/" + soID2)
                                .set("Authorization", userID)
                                .then(function (res) {
                                    expect(res.status).to.equal(200);
                                });
                        }).then(function () {
                            return chai.request(app)
                                .del(url_prefix + "/gateway/" + gID)
                                .set("Authorization", userID)
                                .then(function (res) {
                                    expect(res.status).to.equal(200);
                                });
                        });
                });

                it("Should get all Service Objects for a gateway successfully", function () {
                    return chai.request(app)
                        .get(url_prefix + "/" + gID + "/sos")
                        .set("Authorization", userID)
                        .then(function (res) {
                            expect(res.status).to.equal(200);
                            expect(res.body).to.deep.equal([soID1, soID2]);

                        });
                });

                it("Should reject getting all Service Objects for gateway due to missing gateway", function () {
                    return chai.request(app)
                        .get(url_prefix + "/" + "missing_gateway" + "/sos")
                        .set("Authorization", userID)
                        .catch(function (res) {
                            expect(res.status).to.equal(400);

                        });
                });

                it("Should reject getting all Service Objects for gateway due to missing authentication", function () {
                    return chai.request(app)
                        .get(url_prefix + "/" + gID + "/sos")
                        .catch(function (res) {
                            expect(res.status).to.equal(403);

                        });
                });
            });
        });

        describe("Get no Service Objects for Gateway as no ones are added", function () {
            var gID;
            var soWithGateway = clone(so);

            before(function () {
                return chai.request(app)
                    .post(url_prefix + "/gateway")
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(gateway)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                        expect(res.body).to.have.property("gatewayID");
                        gID = res.body.gatewayID;
                        soWithGateway.gateway = {
                            gatewayID: gID
                        };

                    });
            });
            after(function () {
                return chai.request(app)
                    .del(url_prefix + "/gateway/" + gID)
                    .set("Authorization", userID)
                    .then(function (res) {
                        expect(res.status).to.equal(200);

                    });
            });
            it("Should get all Service Objects for a gateway successfully", function () {
                return chai.request(app)
                    .get(url_prefix + "/" + gID + "/sos")
                    .set("Authorization", userID)
                    .catch(function (res) {
                        expect(res.status).to.equal(400);
                    });
            });
        });
    });

    describe("Gateways", function () {
        var badSyntaxGateway = {
            name: "Test Gateway1" // missing URL property
        };

        describe('add Gateway', function () {
            var gID;

            afterEach(function () {
                return Promise.resolve()
                    .then(function () {
                        if (gID) {
                            return chai.request(app)
                                .del(url_prefix + "/gateway/" + gID)
                                .set("Authorization", userID)
                                .then(function (res) {
                                    expect(res.status).to.equal(200);
                                });
                        }
                    });
            });

            it("Should accept a gateway successfully", function () {
                return chai.request(app)
                    .post(url_prefix + "/gateway")
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(gateway)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                        expect(res.body).to.have.property("gatewayID");
                        gID = res.body.gatewayID;
                    });
            });

            it("Should reject a service object due to bad syntax", function () {
                return chai.request(app)
                    .post(url_prefix + "/gateway")
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(badSyntaxGateway)
                    .catch(function (res) {
                        expect(res.status).to.equal(400);
                        gID = null;
                    });
            });

            it("Should reject request due to missing authentication", function () {
                return chai.request(app)
                    .post(url_prefix + "/gateway")
                    .set("Content-Type", "application/json")
                    .send(gateway)
                    .catch(function (res) {
                        expect(res.status).to.equal(403);
                        gID = null;
                    });
            });
        });

        describe('update Gateway', function () {
            var gID;
            var gatewayUpdated = {
                "name": "Smart Home 1",
                "URL": "https://gateway_test.com/dir/to/my/gateway/",
                "port": 443,
                "protocol": "HTTPS"
            };

            beforeEach(function () {
                return chai.request(app)
                    .post(url_prefix + "/gateway")
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(gateway)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                        expect(res.body).to.have.property("gatewayID");
                        gID = res.body.gatewayID;
                    });
            });

            afterEach(function () {
                return chai.request(app)
                    .del(url_prefix + "/gateway/" + gID)
                    .set("Authorization", userID)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                    });
            });

            it("Should accept request and update successfully", function () {
                return chai.request(app)
                    .put(url_prefix + "/gateway/" + gID)
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(gatewayUpdated)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                    });
            });

            it("Should reject request due to bad syntax", function () {
                return chai.request(app)
                    .put(url_prefix + "/gateway/" + gID)
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(badSyntaxGateway)
                    .catch(function (res) {
                        expect(res.status).to.equal(400);
                    });
            });

            it("Should reject request due to missing authorization", function () {
                return chai.request(app)
                    .put(url_prefix + "/gateway/" + gID)
                    .set("Content-Type", "application/json")
                    .send(gatewayUpdated)
                    .catch(function (res) {
                        expect(res.status).to.equal(403);
                    });
            });
        });

        describe('get Gateway', function () {
            var gID;

            beforeEach(function () {
                return chai.request(app)
                    .post(url_prefix + "/gateway")
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(gateway)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                        expect(res.body).to.have.property("gatewayID");
                        gID = res.body.gatewayID;
                    });
            });

            afterEach(function () {
                return chai.request(app)
                    .del(url_prefix + "/gateway/" + gID)
                    .set("Authorization", userID)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                    });
            });

            it("Should accept request and return gateway description", function () {
                return chai.request(app)
                    .get(url_prefix + "/gateway/" + gID)
                    .set("Authorization", userID)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                    });
            });

            it("Should reject request due to missing gateway", function () {
                return chai.request(app)
                    .get(url_prefix + "/gateway/" + "THIS_CANNOT_BE_A_GATEWAY_ID")
                    .set("Authorization", userID)
                    .catch(function (res) {
                        expect(res.status).to.equal(400);
                    });
            });

            it("Should reject request due to missing authentication", function () {
                return chai.request(app)
                    .get(url_prefix + "/gateway/" + gID)
                    .catch(function (res) {
                        expect(res.status).to.equal(403);
                    });
            });
        });

        describe('remove Gateway', function () {
            var gID;

            beforeEach(function () {
                return chai.request(app)
                    .post(url_prefix + "/gateway")
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(gateway)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                        expect(res.body).to.have.property("gatewayID");
                        gID = res.body.gatewayID;
                    });
            });

            afterEach(function () {
                if (gID) {
                    return chai.request(app)
                        .del(url_prefix + "/gateway/" + gID)
                        .set("Authorization", userID)
                        .then(function (res) {
                            expect(res.status).to.equal(200);
                        });
                }
            });

            it("Should accept request and remove gateway", function () {
                return chai.request(app)
                    .del(url_prefix + "/gateway/" + gID)
                    .set("Authorization", userID)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                        gID = null;
                    });
            });

            it("Should reject request due to missing gateway", function () {
                return chai.request(app)
                    .del(url_prefix + "/gateway/" + "THIS_CANNOT_BE_A_GATEWAY_ID")
                    .set("Authorization", userID)
                    .catch(function (res) {
                        expect(res.status).to.equal(400);
                    });
            });

            // TODO Phil 22/11/16: This test case doesn't work yet, as there is still a problem with chaining promises.
            // it("Should reject request due to failed authentication", function () {
            //     chai.request(app)
            //         .del(url_prefix + "/gateway/" + gID)
            //         .catch(function (res) {
            //             expect(res.status).to.equal(403);
            //         });
            // });
        });

        describe('get all Gateways for User', function () {
            var gID1, gID2;

            before(function () {
                return Promise.resolve()
                    .then(function () {
                        return chai.request(app)
                            .post(url_prefix + "/gateway")
                            .set("Authorization", userID)
                            .set("Content-Type", "application/json")
                            .send(gateway)
                            .then(function (res) {
                                expect(res.status).to.equal(200);
                                expect(res.body).to.have.property("gatewayID");
                                gID1 = res.body.gatewayID;
                            });
                    }).then(function () {
                        return chai.request(app)
                            .post(url_prefix + "/gateway")
                            .set("Authorization", userID)
                            .set("Content-Type", "application/json")
                            .send(gateway)
                            .then(function (res) {
                                expect(res.status).to.equal(200);
                                expect(res.body).to.have.property("gatewayID");
                                gID2 = res.body.gatewayID;
                            });
                    });
            });

            after(function () {
                return Promise.resolve()
                    .then(function () {
                        return chai.request(app)
                            .del(url_prefix + "/gateway/" + gID1)
                            .set("Authorization", userID)
                            .then(function (res) {
                                expect(res.status).to.equal(200);
                            });
                    }).then(function () {
                        return chai.request(app)
                            .del(url_prefix + "/gateway/" + gID2)
                            .set("Authorization", userID)
                            .then(function (res) {
                                expect(res.status).to.equal(200);
                            });
                    });

            });

            it("Should successfully get all Gateways for a User", function () {
                return chai.request(app)
                    .get(url_prefix + "/gateway")
                    .set("Authorization", userID)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                        expect(res.body).to.deep.equal([gID1, gID2]);
                    });
            });

            it("Should reject getting all Gateways for a User due to missing authentication", function () {
                return chai.request(app)
                    .get(url_prefix + "/gateway")
                    .catch(function (res) {
                        expect(res.status).to.equal(403);
                    });
            });
        });

        describe("Should get no Gateways for User as there are none", function () {
            it("Should reject getting all Gateways for a User due to missing Gateways", function () {
                return chai.request(app)
                    .get(url_prefix + "/gateway")
                    .set("Authorization", userID)
                    .catch(function (res) {
                        expect(res.status).to.equal(400);
                    });
            });
        });
    });

    /*
    describe("Sensor Data", function () {
        var sensordata = {
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

        var badSyntaxSensorData = {
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

        describe('push Sensor Data', function () {
            var soID;
            var streamID;
            var added = false;
            before(function () {
                return chai.request(app)
                    .post(url_prefix)
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(soWithoutGateway)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                        expect(res.body).to.have.property("soID");
                        soID = res.body.soID;
                        streamID = so.streams[0].name;
                    });
            });

            after(function () {
                return chai.request(app)
                    .del(url_prefix + "/" + soID)
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                    }).then(function () {
                        // TODO Phil 23/11/16: test removing sensor data
                        // if (added) {
                        //     return chai.request(app)
                        //         .del(url_prefix + "/" + soID + "/" + streamID)
                        //         .set("Authorization", userID)
                        //         .then(function (res) {
                        //             expect(res.status).to.equal(200);
                        //         });
                        // }
                    });
            });

            it("Should accept request and store sensor data", function () {
                return chai.request(app)
                    .put(url_prefix + "/" + soID + "/streams/" + streamID)
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(sensordata)
                    .then(function (res) {
                        expect(res.status).to.equal(201);
                        added = true;
                    });
            });

            it("Should reject request due to bad syntax", function () {
                return chai.request(app)
                    .put(url_prefix + "/" + soID + "/streams/" + streamID)
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(badSyntaxSensorData)
                    .catch(function (res) {
                        expect(res.status).to.equal(400);
                        added = false;
                    });
            });

            it("Should reject request due to missing authentication", function () {
                return chai.request(app)
                    .put(url_prefix + "/" + soID + "/streams/" + streamID)
                    .set("Content-Type", "application/json")
                    .send(sensordata)
                    .catch(function (res) {
                        expect(res.status).to.equal(403);
                        added = false;
                    });
            });
        });

        describe("remove Sensor Data", function () {
            var soID;
            var streamID;
            var removed = false;
            beforeEach(function () {
                return Promise.resolve()
                    .then(function () {
                        return chai.request(app)
                            .post(url_prefix)
                            .set("Authorization", userID)
                            .set("Content-Type", "application/json")
                            .send(soWithoutGateway)
                            .then(function (err, res) {
                                expect(res.status).to.equal(200);
                                expect(res.body).to.have.property("soID");
                                soID = res.body.soID;
                                streamID = so.streams[0].name;
                            });
                    }).then(function () {
                        return chai.request(app)
                            .put(url_prefix + "/" + soID + "/streams/" + streamID)
                            .set("Authorization", userID)
                            .set("Content-Type", "application/json")
                            .send(sensordata)
                            .then(function (err, res) {
                                expect(res.status).to.equal(201);
                            });
                    }).then(function () {
                        return chai.request(app)
                            .put(url_prefix + "/" + soID + "/streams/" + streamID)
                            .set("Authorization", userID)
                            .set("Content-Type", "application/json")
                            .send(sensordata)
                            .then(function (err, res) {
                                expect(res.status).to.equal(201);
                            });
                    });
            });

            afterEach(function () {
                return Promise.resolve()
                    .then(function () {
                        return chai.request(app)
                            .del(url_prefix + "/" + soID)
                            .set("Authorization", userID)
                            .set("Content-Type", "application/json")
                            .then(function (res) {
                                expect(res.status).to.equal(200);
                            });
                    }).then(function () {
                        if (!removed) {
                            return chai.request(app)
                                .del(url_prefix + "/" + soID + "/streams/" + streamID)
                                .set("Authorization", userID)
                                .then(function (res) {
                                    expect(res.status).to.equal(204);
                                });
                        }
                    });
            });

            it("Should accept request and remove sensor data", function () {
                return chai.request(app)
                    .del(url_prefix + "/" + soID + "/streams/" + streamID)
                    .set("Authorization", userID)
                    .then(function (res) {
                        expect(res.status).to.equal(204);
                        removed = true;
                    });
            });

            it("Should reject request due to missing authentication", function () {
                return chai.request(app)
                    .del(url_prefix + "/" + soID + "/streams/" + streamID)
                    .catch(function (res) {
                        expect(res.status).to.equal(403);
                        removed = false;
                    });
            });
        });

        describe("Doesn't remove Sensor Data for Stream as it is not added", function () {
            var soID;
            var streamID;
            var removed = false;
            before(function () {
                chai.request(app)
                    .post(url_prefix)
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(soWithoutGateway)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                        expect(res.body).to.have.property("soID");
                        soID = res.body.soID;
                        streamID = so.streams[0].name;
                    });
            });

            after(function () {
                chai.request(app)
                    .del(url_prefix + "/" + soID)
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .then(function (res) {
                        expect(res.status).to.equal(200);

                        if (!removed) {
                            return chai.request(app)
                                .del(url_prefix + "/" + soID + "/streams/" + streamID)
                                .set("Authorization", userID)
                                .then(function (res) {
                                    expect(res.status).to.equal(204);
                                });
                        }
                    });
            });

            // TODO Phil 22/11/16: This test case doesn't work yet, as there is still a problem with chaining promises.
            // it("Should reject request due to missing sensor data", function () {
            //     chai.request(app)
            //         .del(url_prefix + "/" + soID + "/streams/" + streamID)
            //         .set("Authorization", userID)
            //         .catch(function (res) {
            //             expect(res.status).to.equal(400);
            //             removed = false;
            //         });
            // });

        });

        describe("get Sensor Data", function () {
            it("Should accept request and return sensor data", function () {
                var soID = "";
                var streamID = "";
                chai.request(app)
                    .get(url_prefix + "/" + soID + "/streams/" + streamID)
                    .set("Authorization", userID)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                        expect(res.body).to.have.property("data");
                    });
            });

            it("Should accept request and return sensor data with options", function () {
                var soID = "";
                var streamID = "";
                var options = "";
                chai.request(app)
                    .get(url_prefix + "/" + soID + "/streams/" + streamID + "/" + options)
                    .set("Authorization", userID)
                    .then(function (res) {
                        expect(res.status).to.equal(200);
                        expect(res.body).to.have.property("data");
                    });
            });

            it("Should reject request due to missing sensor data", function () {
                var soID = "";
                var streamID = "";
                chai.request(app)
                    .get(url_prefix + "/" + soID + "/streams/" + streamID)
                    .set("Authorization", userID)
                    .catch(function (res) {
                        expect(res.status).to.equal(400);
                    });
            });

            it("Should reject request due to failed authentication", function () {
                var soID = "";
                var streamID = "";
                chai.request(app)
                    .get(url_prefix + "/" + soID + "/streams/" + streamID)
                    .set("Authorization", badUserID)
                    .catch(function (res) {
                        expect(res.status).to.equal(403);
                    });
            });
        });
    });
    */
});

