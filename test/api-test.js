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

/*

// TODO Phil 24/09/16: actually make correct service objects
describe("API", function () {
    describe('add ServiceObject', function () {
        it("Should accept a serving object successfully", function (done) {
            var correctSO = {};
            chai.request(server)
                .post("/")
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
                .send(incorrectSO)
                .end(function (err, res) {
                    res.should.have.status(507);
                    done();
                })
        });
    });

    describe('get ServiceObject', function () {
        it("Should accept request and get ServiceObject successfully", function (done) {
            chai.request(server)
                .get("/")
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.body.should.have.property("gatewayID");
                    res.body.should.have.property("name");
                    res.body.should.have.property("description");
                    res.body.should.have.property("streams");
                    done();
                })
            }
        );
    });

    describe('update ServiceObject', function () {
        it("Should update a service object successfully", function (done) {
            var updatedSO = {
                soID: "jsdj93d3ijd3jd3"
            };

            chai.request(server)
                .put("/" + updatedSO.soID)
                .send(updatedSO)
                .end(function (err, res) {
                    res.should.have.status(200);
                    done();
                })
        });
        it("Should reject updating service object due to wrong id", function (done) {
            chai.request(server)
                .put("/" + "This_cannot_be_a_id")
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
                .end(function (err, res) {
                    res.should.have.status(200);
                    done();
                });
        });

        it("Should reject deleting service object due to wrong id", function (done) {
            chai.request(server)
                .del("/" + "This_cannot_be_a_id")
                .end(function (err, res) {
                    res.should.have.status(507);
                    done();
                });
        });
    });

    describe('get all service objects for gateway', function () {
        it("Should get all service objects for gateway", function (done) {
            chai.request(server)
                .get("/SOs")
                .end(function (err, res) {
                    res.should.have.status(507);
                    done();
                });
        });
    });

    describe('get all service objects for a user', function () {

    });

    describe('add Gateway', function () {

    });

    describe('update Gateway', function () {

    });

    describe('remove Gateway', function () {

    });

    describe('get all gateways for user', function () {

    });
});

*/

