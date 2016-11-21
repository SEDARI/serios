process.env.NODE_ENV = 'test';

var http = require("http");
var express = require("express");
var app = express();

var chai = require("chai");
var should = chai.should();
var assert = chai.assert;
var chaiHttp = require("chai-http");
chai.use(chaiHttp);

var uuid = require("uuid");

var serios = require("../serios/serios.js");
var core = require("../serios/core");
var settings = require("../settings");
var server = null;
var url_prefix = "/api";

before(function (done) {
    settings.storage.location = "mongodb://localhost/serios-test";
    server = http.createServer(function (req, res) {
        app(req, res);
    });
    serios.init(server, settings);
    app.use("/", serios.app);
    serios.start();

    done();
});

after(function (done) {
    server.stop();
    done();
});

describe("API", function () {
    this.timeout(1000);
    var userID = uuid();
    var badUserID = "wrong_user";

    describe("Service Objects", function () {
        describe('add ServiceObject', function () {
            var correctSO =
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
            var incorrectSO = {};


            it("Should accept a serving object successfully", function (done) {
                chai.request(app)
                    .post(url_prefix + "/")
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(correctSO)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.body.should.have.property("soID");
                        done();
                    });
            });

            it("Should reject a service object due to bad syntax", function (done) {
                chai.request(app)
                    .post(url_prefix + "/")
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(incorrectSO)
                    .end(function (err, res) {
                        res.should.have.status(400);
                        done();
                    });
            });
        });

        describe('get ServiceObject', function () {
            it("Should accept request and get ServiceObject successfully", function (done) {
                    var soID = "jsdj93d3ijd3jd3";
                    chai.request(app)
                        .get(url_prefix + "/" + soID)
                        .set("Authorization", userID)
                        .end(function (err, res) {
                            res.should.have.status(200);
                            res.body.should.have.property("gatewayID");
                            res.body.should.have.property("name");
                            res.body.should.have.property("description");
                            res.body.should.have.property("streams");
                            done();
                        });
                }
            );

            it("Should reject request as the service object was not found", function (done) {
                chai.request(app)
                    .get(url_prefix + "/" + "DEF_A_WRONG_SO_ID")
                    .end(function (err, res) {
                        res.should.have.status(400);
                        done();
                    });
            });

            it("Should reject request due to missing authentication", function (done) {
                var soID = "jsdj93d3ijd3jd3";
                chai.request(app)
                    .get(url_prefix + "/" + soID)
                    .end(function (err, res) {
                        res.should.have.status(403);
                        done();
                    });
            });
        });

        describe('update ServiceObject', function () {
            it("Should update a service object successfully", function (done) {
                var updatedSO = {
                    soID: "jsdj93d3ijd3jd3"
                };

                chai.request(app)
                    .put("/" + updatedSO.soID)
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(updatedSO)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        done();
                    });
            });

            it("Should reject updating service object due to wrong id", function (done) {
                chai.request(app)
                    .put("/" + "This_cannot_be_an_id")
                    .set("Authorization", badUserID)
                    .end(function (err, res) {
                        res.should.have.status(507);
                        done();
                    });
            });
        });

        describe('remove ServiceObject', function () {
            it("Should remove a service object successfully", function (done) {
                var soID = "jd39j33d3jd939d3j";
                chai.request(app)
                    .del(url_prefix + "/" + soID)
                    .set("Authorization", userID)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        done();
                    });
            });

            it("Should reject deleting service object due to wrong id", function (done) {
                chai.request(app)
                    .del(url_prefix + "/" + "This_cannot_be_a_id")
                    .set("Authorization", userID)
                    .end(function (err, res) {
                        res.should.have.status(507);
                        done();
                    });
            });
        });

        describe('get all service objects for a user', function () {
            it("Should get all service objects for a user", function (done) {
                chai.request(app)
                    .get(url_prefix + "/SOs")
                    .set("Authorization", userID)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.body.should.have.property("SOs");
                        done();
                    });
            });

            it("Should reject service object due to failed authentication", function (done) {
                chai.request(app)
                    .get(url_prefix + "/SOs")
                    .set("Authorization", badUserID)
                    .end(function (err, res) {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
    });

    describe("Gateways", function () {
        describe('add Gateway', function () {
            it("Should accept a gateway successfully", function (done) {
                var correctGW = {};
                chai.request(app)
                    .post(url_prefix + "/gateway")
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(correctGW)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.body.should.have.property("gatewayID");
                        done();
                    });
            });

            it("Should reject a service object due to bad syntax", function (done) {
                var incorrectGW = {};
                chai.request(app)
                    .post(url_prefix + "/gateway")
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(incorrectGW)
                    .end(function (err, res) {
                        res.should.have.status(400);
                        done();
                    });
            });

            it("Should reject request due to failed authentication", function (done) {
                var correctGW = {};
                chai.request(app)
                    .post(url_prefix + "/gateway")
                    .set("Authorization", badUserID)
                    .set("Content-Type", "application/json")
                    .send(correctGW)
                    .end(function (err, res) {
                        res.should.have.status(403);
                        done();
                    });
            });
        });

        describe('update Gateway', function () {
            it("Should accept request and update sucessfully", function (done) {
                var correctGW = {
                    gatewayID: "2mv845nmvsk39"
                };
                chai.request(app)
                    .put("/gateway/" + correctGW.gatewayID)
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(correctGW)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        done();
                    });
            });

            it("Should reject request due to bad syntax", function (done) {
                var incorrectGW = {
                    gatewayID: "2mv845nmvsk39",
                    thisfielddoesnotexist: "value"
                };
                chai.request(app)
                    .put("/gateway/" + incorrectGW.gatewayID)
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(incorrectGW)
                    .end(function (err, res) {
                        res.should.have.status(400);
                        done();
                    });
            });

            it("Should reject request due to missing service object", function (done) {
                var correctGW = {
                    gatewayID: "2mv845nmvsk39"
                };
                chai.request(app)
                    .put("/gateway/" + correctGW.gatewayID)
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(correctGW)
                    .end(function (err, res) {
                        res.should.have.status(403);
                        done();
                    });
            });
        });

        describe('get Gateway', function () {
            it("Should accept request and return gateway description", function (done) {
                var requestedGW = "2mv845nmvsk39";
                chai.request(app)
                    .get(url_prefix + "/gateway/" + requestedGW)
                    .set("Authorization", userID)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.body.should.have.property("id");
                        res.body.should.have.property("URL");
                        res.body.should.have.property("port");
                        done();
                    });
            });

            it("Should reject request due to missing gateway", function (done) {
                var requestedGW = "THIS_CANNOT_BE_A_GATEWAY_ID";
                chai.request(app)
                    .get(url_prefix + "/gateway/" + requestedGW)
                    .set("Authorization", userID)
                    .end(function (err, res) {
                        res.should.have.status(400);
                        done();
                    });
            });

            it("Should reject request due to failed authentication", function (done) {
                var requestedGW = "2mv845nmvsk39";
                chai.request(app)
                    .get(url_prefix + "/gateway/" + requestedGW)
                    .set("Authorization", badUserID)
                    .end(function (err, res) {
                        res.should.have.status(403);
                        done();
                    });
            });
        });

        describe('remove Gateway', function () {
            it("Should accept request and remove gateway", function (done) {
                var requestedGW = "2mv845nmvsk39";
                chai.request(app)
                    .del(url_prefix + "/gateway/" + requestedGW)
                    .set("Authorization", userID)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        done();
                    });
            });

            it("Should reject request due to missing gateway", function (done) {
                var requestedGW = "this_is_not_a_gateway_id";
                chai.request(app)
                    .del(url_prefix + "/gateway/" + requestedGW)
                    .set("Authorization", userID)
                    .end(function (err, res) {
                        res.should.have.status(400);
                        done();
                    });
            });

            it("Should reject request due to failed authentication", function (done) {
                var requestedGW = "2mv845nmvsk39";
                chai.request(app)
                    .del(url_prefix + "/gateway/" + requestedGW)
                    .set("Authorization", badUserID)
                    .end(function (err, res) {
                        res.should.have.status(403);
                        done();
                    });
            });
        });

        describe('get all gateways for user', function () {

        });

        describe('get all service objects for gateway', function () {
            it("Should get all service objects for gateway", function (done) {
                var requestedGW = "2mv845nmvsk39";
                chai.request(app)
                    .get(requestedGW + "/SOs")
                    .set("Authorization", userID)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.body.should.have.property("SOs");
                        done();
                    });
            });

            it("Should reject request due to failed authentication", function (done) {
                var requestedGW = "2mv845nmvsk39";
                chai.request(app)
                    .get(requestedGW + "/SOs")
                    .set("Authorization", badUserID)
                    .end(function (err, res) {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
    });

    describe("Sensor Data", function () {
        describe('push Sensor Data', function () {
            it("Should accept request and store sensor data", function (done) {
                var soID = "";
                var streamID = "";
                var data = {};
                chai.request(app)
                    .put("/" + soID + "/streams/" + streamID)
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(data)
                    .end(function (err, res) {
                        res.should.have.status(201);
                        done();
                    });
            });

            it("Should reject request due to bad syntax", function (done) {
                var soID = "";
                var streamID = "";
                var incorrectData = {};
                chai.request(app)
                    .put("/" + soID + "/streams/" + streamID)
                    .set("Authorization", userID)
                    .set("Content-Type", "application/json")
                    .send(incorrectData)
                    .end(function (err, res) {
                        res.should.have.status(400);
                        done();
                    });
            });

            it("Should reject request due to failed authentication", function (done) {
                var soID = "";
                var streamID = "";
                var data = {};
                chai.request(app)
                    .put("/" + soID + "/streams/" + streamID)
                    .set("Authorization", badUserID)
                    .set("Content-Type", "application/json")
                    .send(data)
                    .end(function (err, res) {
                        res.should.have.status(403);
                        done();
                    });
            });
        });

        describe("remove Sensor Data", function () {
            it("Should accept request and remove sensor data", function (done) {
                var soID = "";
                var streamID = "";
                chai.request(app)
                    .del(url_prefix + "/" + soID + "/streams/" + streamID)
                    .set("Authorization", userID)
                    .end(function (err, res) {
                        res.should.have.status(204);
                        done();
                    });
            });

            it("Should reject request due to missing sensor data", function (done) {
                var soID = "";
                var streamID = "";
                chai.request(app)
                    .del(url_prefix + "/" + soID + "/streams/" + streamID)
                    .set("Authorization", userID)
                    .end(function (err, res) {
                        res.should.have.status(400);
                        done();
                    });
            });

            it("Should reject request due to failed authentication", function (done) {
                var soID = "";
                var streamID = "";
                chai.request(app)
                    .del(url_prefix + "/" + soID + "/streams/" + streamID)
                    .set("Authorization", badUserID)
                    .end(function (err, res) {
                        res.should.have.status(403);
                        done();
                    });
            });
        });

        describe("get Sensor Data", function () {
            it("Should accept request and return sensor data", function (done) {
                var soID = "";
                var streamID = "";
                chai.request(app)
                    .get(url_prefix + "/" + soID + "/streams/" + streamID)
                    .set("Authorization", userID)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.body.should.have.property("data");
                        done();
                    });
            });

            it("Should accept request and return sensor data with options", function (done) {
                var soID = "";
                var streamID = "";
                var options = "";
                chai.request(app)
                    .get(url_prefix + "/" + soID + "/streams/" + streamID + "/" + options)
                    .set("Authorization", userID)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.body.should.have.property("data");
                        done();
                    });
            });

            it("Should reject request due to missing sensor data", function (done) {
                var soID = "";
                var streamID = "";
                chai.request(app)
                    .get(url_prefix + "/" + soID + "/streams/" + streamID)
                    .set("Authorization", userID)
                    .end(function (err, res) {
                        res.should.have.status(400);
                        done();
                    });
            });

            it("Should reject request due to failed authentication", function (done) {
                var soID = "";
                var streamID = "";
                chai.request(app)
                    .get(url_prefix + "/" + soID + "/streams/" + streamID)
                    .set("Authorization", badUserID)
                    .end(function (err, res) {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
    });
});

