process.env.NODE_ENV = 'test';

var http = require("http");
var express = require("express");

var chai = require("chai");
var assert = chai.assert;
var httpChai = require("chai-http");
chai.use(httpChai);

var serios = require("../serios/serios.js");
var core = require("../serios/core");
var settings = require("../settings");
var server = null;

// TODO Phil 05/10/16: get test user
var user = "";
var password = "";

before(function (done) {
    server = http.createServer(function (req, res) {
        var app = express();
        app(req, res);
    });
    serios.init(server, settings);
    done();
});

after(function (done) {
    server.stop();
    done();
});

describe("API", function () {
    // TODO Phil 24/09/16: actually make correct service objects
    describe("Service Objects", function () {
        describe('add ServiceObject', function () {
            it("Should accept a serving object successfully", function (done) {
                var correctSO = {};
                chai.request(server)
                    .post("/")
                    .auth(user, password)
                    .send(correctSO)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.body.should.have.property("soID");
                        done();
                    });
            });

            it("Should reject a service object due to bad syntax", function (done) {
                var incorrectSO = {};
                chai.request(server)
                    .post("/")
                    .auth(user, password)
                    .send(incorrectSO)
                    .end(function (err, res) {
                        res.should.have.status(400);
                        done();
                    })
            });
        });

        describe('get ServiceObject', function () {
            it("Should accept request and get ServiceObject successfully", function (done) {
                    var soID = "jsdj93d3ijd3jd3";
                    chai.request(server)
                        .get("/" + soID)
                        .auth(user, password)
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
                chai.request(server)
                    .get("/" + "DEF_A_WRONG_SO_ID")
                    .end(function (err, res) {
                        res.should.have.status(400);
                        done();
                    })
            });

            it("Should reject request due to missing authentication", function (done) {
                var soID = "jsdj93d3ijd3jd3";
                chai.request(server)
                    .get("/" + soID)
                    .end(function (err, res) {
                        res.should.have.status(403);
                        done();
                    })
            });
        });

        describe('update ServiceObject', function () {
            it("Should update a service object successfully", function (done) {
                var updatedSO = {
                    soID: "jsdj93d3ijd3jd3"
                };

                chai.request(server)
                    .put("/" + updatedSO.soID)
                    .auth(user, password)
                    .send(updatedSO)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        done();
                    })
            });

            it("Should reject updating service object due to wrong id", function (done) {
                chai.request(server)
                    .put("/" + "This_cannot_be_an_id")
                    .end(function (err, res) {
                        res.should.have.status(507);
                        done();
                    });
            });
        });

        describe('remove ServiceObject', function () {
            it("Should remove a service object successfully", function (done) {
                var soID = "jd39j33d3jd939d3j";
                chai.request(server)
                    .del("/" + soID)
                    .auth(user, password)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        done();
                    });
            });

            it("Should reject deleting service object due to wrong id", function (done) {
                chai.request(server)
                    .del("/" + "This_cannot_be_a_id")
                    .auth(user, password)
                    .end(function (err, res) {
                        res.should.have.status(507);
                        done();
                    });
            });
        });

        describe('get all service objects for a user', function () {
            it("Should get all service objects for a user", function (done) {
                chai.request(server)
                    .get("/SOs")
                    .auth(user, password)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.body.should.have.property("SOs");
                        done();
                    });
            });

            // TODO Phil 05/10/16: look at it later
            it("Should reject service object due to failed authentication", function (done) {
                chai.request(server)
                    .get("SOs")
                    .auth(user, "wrong password")
                    .end(function (err, res) {
                        res.should.have.status(403);
                        done();
                    });
            })
        });
    });

    describe("Gateways", function () {
        // TODO Phil 05/10/16: Actually give gateways a correct syntax.
        describe('add Gateway', function () {
            it("Should accept a gateway successfully", function (done) {
                var correctGW = {};
                chai.request(server)
                    .post("/gateway")
                    .auth(user, password)
                    .send(correctGW)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.body.should.have.property("gatewayID");
                        done();
                    });
            });

            it("Should reject a service object due to bad syntax", function (done) {
                var incorrectGW = {};
                chai.request(server)
                    .post("/gateway")
                    .auth(user, password)
                    .send(incorrectGW)
                    .end(function (err, res) {
                        res.should.have.status(400);
                        done();
                    })
            });

            it("Should reject request due to failed authentication", function (done) {
                var correctGW = {};
                chai.request(server)
                    .post("/gateway")
                    .auth(user, "wrong password")
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
                chai.request(server)
                    .put("/gateway/" + correctGW.gatewayID)
                    .auth(user, password)
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
                chai.request(server)
                    .put("/gateway/" + incorrectGW.gatewayID)
                    .auth(user, password)
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
                chai.request(server)
                    .put("/gateway/" + correctGW.gatewayID)
                    .auth(user, password)
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
                chai.request(server)
                    .get("/gateway/" + requestedGW)
                    .auth(user, password)
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
                chai.request(server)
                    .get("/gateway/" + requestedGW)
                    .auth(user, password)
                    .end(function (err, res) {
                        res.should.have.status(400);
                        done();
                    });
            });

            it("Should reject request due to failed authentication", function (done) {
                var requestedGW = "2mv845nmvsk39";
                chai.request(server)
                    .get("/gateway/" + requestedGW)
                    .auth(user, "wrong_password")
                    .end(function (err, res) {
                        res.should.have.status(403);
                        done();
                    });
            });
        });

        describe('remove Gateway', function () {
            it("Should accept request and remove gateway", function (done) {
                var requestedGW = "2mv845nmvsk39";
                chai.request(server)
                    .del("/gateway/" + requestedGW)
                    .auth(user, password)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        done();
                    })
            });

            it("Should reject request due to missing gateway", function (done) {
                var requestedGW = "this_is_not_a_gateway_id";
                chai.request(server)
                    .del("/gateway/" + requestedGW)
                    .auth(user, password)
                    .end(function (err, res) {
                        res.should.have.status(400);
                        done();
                    })
            });

            it("Should reject request due to failed authentication", function (done) {
                var requestedGW = "2mv845nmvsk39";
                chai.request(server)
                    .del("/gateway/" + requestedGW)
                    .auth(user, "wrong password")
                    .end(function (err, res) {
                        res.should.have.status(403);
                        done();
                    })
            });
        });

        describe('get all gateways for user', function () {

        });

        describe('get all service objects for gateway', function () {
            it("Should get all service objects for gateway", function (done) {
                var requestedGW = "2mv845nmvsk39";
                chai.request(server)
                    .get(requestedGW + "/SOs")
                    .auth(user, password)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.body.should.have.property("SOs");
                        done();
                    });
            });

            it("Should reject request due to failed authentication", function (done) {
                var requestedGW = "2mv845nmvsk39";
                chai.request(server)
                    .get(requestedGW + "/SOs")
                    .auth(user, 'wrong password')
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
                chai.request(server)
                    .put("/" + soID + "/streams/" + streamID)
                    .auth(user, password)
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
                chai.request(server)
                    .put("/" + soID + "/streams/" + streamID)
                    .auth(user, password)
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
                chai.request(server)
                    .put("/" + soID + "/streams/" + streamID)
                    .auth(user, "wrong password")
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
                chai.request(server)
                    .del("/" + soID + "/streams/" + streamID)
                    .auth(user, password)
                    .end(function (err, res) {
                        res.should.have.status(204);
                        done();
                    });
            });

            it("Should reject request due to missing sensor data", function (done) {
                var soID = "";
                var streamID = "";
                chai.request(server)
                    .del("/" + soID + "/streams/" + streamID)
                    .auth(user, password)
                    .end(function (err, res) {
                        res.should.have.status(400);
                        done();
                    });
            });

            it("Should reject request due to failed authentication", function (done) {
                var soID = "";
                var streamID = "";
                chai.request(server)
                    .del("/" + soID + "/streams/" + streamID)
                    .auth(user, "wrong password")
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
                chai.request(server)
                    .get("/" + soID + "/streams/" + streamID)
                    .auth(user, password)
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
                chai.request(server)
                    .get("/" + soID + "/streams/" + streamID + "/" + options)
                    .auth(user, password)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.body.should.have.property("data");
                        // TODO Phil 05/10/16: check if the received data is valid to the options
                        done();
                    });
            });

            it("Should reject request due to missing sensor data", function (done) {
                var soID = "";
                var streamID = "";
                chai.request(server)
                    .get("/" + soID + "/streams/" + streamID)
                    .auth(user, password)
                    .end(function (err, res) {
                        res.should.have.status(400);
                        done();
                    });
            });

            it("Should reject request due to failed authentication", function (done) {
                var soID = "";
                var streamID = "";
                chai.request(server)
                    .get("/" + soID + "/streams/" + streamID)
                    .auth(user, "wrong password")
                    .end(function (err, res) {
                        res.should.have.status(403);
                        done();
                    });
            });
        });
    });
});

