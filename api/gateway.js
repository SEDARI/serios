/**
 * This file handles all logic concerning gateways.
 *
 * This includes API logic as well as calling the storage.
 */

var checkPermission = require("./permissionchecker").checkPermission;
var storage = require("../core/storage");

module.exports = {
    add: add,
    update: update,
    get: get,
    remove: remove,

    getAllGatewaysForUser: getAllGatewaysForUser
};

function add(req, res) {
    var gateway = req.body;
    var authorization = req.headers.authorization;

    checkPermission(authorization).catch(function () {
        res.status(403).json({msg: "Forbidden. Access was denied!"});
    }).then(function (userID) {
        gateway.ownerID = userID;
        return validateSyntax(gateway);
    }).catch(function () {
        res.status(400).json({msg: "Bad Request. Bad syntax used for Gateway."});
    }).then(function () {
        return addGateway(gateway);
    }).catch(function () {
        res.status(507).json({msg: "Insufficient Storage. Could not save Gateway."});
    }).then(function (gatewayID) {
        res.status(200).json({gatewayID: gatewayID, msg: "OK. Gateway was added."});
    });
}

function update(req, res) {
    var gateway = req.body;
    var authorization = req.headers.authorization;
    var gatewayID = req.params.gatewayID;

    checkPermission(authorization).catch(function () {
        res.status(403).json({msg: "Forbidden. Access was denied!"});
    }).then(function (userID) {
        gateway.ownerID = userID;
        return validateSyntax(gateway);
    }).catch(function () {
        res.status(400).json({msg: "Bad Request. Bad syntax used for Gateway."});
    }).then(function () {
        return updateGateway(gatewayID, gateway);
    }).catch(function () {
        res.status(507).json({msg: "Insufficient Storage. Could not update Gateway."});
    }).then(function () {
        res.status(200).json({msg: "OK. Gateway was modified."});
    });
}

function get(req, res) {
    var authorization = req.headers.authorization;
    var gatewayID = req.params.gatewayID;

    checkPermission(authorization).catch(function () {
        res.status(403).json({msg: "Forbidden. Access was denied!"});
    }).then(function () {
        return getGateway(gatewayID);
    }).catch(function () {
        res.status(400).json({msg: "Bad Request. Could not find Gateway."});
    }).then(function (gateway) {
        res.status(200).json(gateway);
    });
}

function remove(req, res) {
    var authorization = req.headers.authorization;
    var gatewayID = req.params.gatewayID;

    checkPermission(authorization).catch(function () {
        res.status(403).json({msg: "Forbidden. Access was denied!"});
    }).then(function () {
        return removeGateway(gatewayID);
    }).catch(function () {
        res.status(400).json({msg: "Bad Request. Could not find Gateway."});
    }).then(function () {
        res.status(200).json({msg: "OK. Gateway was removed."});
    });
}

function getAllGatewaysForUser(req, res) {
    var authorization = req.headers.authorization;

    checkPermission(authorization).catch(function () {
        res.status(403).json({msg: "Forbidden. Access was denied!"});
    }).then(function (userID) {
        return allGatewaysForUser(userID);
    }).catch(function () {
        res.status(400).json({msg: "Bad Request. Could not find Gateways."});
    }).then(function (gateways) {
        res.status(200).json(gateways);
    });
}

/**
 * Calls the storage to validate the syntax of a given gateway.
 *
 * @param gateway the gateway that is validated.
 * @returns {Promise}
 */
var validateSyntax = function (gateway) {
    return storage.validateGatewaySyntax(gateway);
};

/**
 * Calls the storage to add a given gateway.
 *
 * @param gateway the gateway that is added.
 * @returns {Promise}
 */
var addGateway = function (gateway) {
    return storage.addGateway(gateway);
};

/**
 * Calls the storage to update a given gateway.
 *
 * @param gatewayID the identifier of the gateway that is updated.
 * @param gateway the new values of the gateway.
 * @returns {Promise}
 */
var updateGateway = function (gatewayID, gateway) {
    return storage.updateGateway(gatewayID, gateway);
};

/**
 * Calls the storage to get the description of a gateway.
 *
 * @param gatewayID the identifier of the requested gateway.
 * @returns {Promise}
 */
var getGateway = function (gatewayID) {
    return storage.getGateway(gatewayID);
};

/**
 * Calls the storage to remove a given gateway.
 *
 * @param gatewayID the gateway that is removed.
 * @returns {Promise}
 */
var removeGateway = function (gatewayID) {
    return storage.removeGateway(gatewayID);
};

/**
 * Calls the storage to return all gateways for a given user.
 *
 * @param userID the identifier of the user.
 * @returns {*}
 */
var allGatewaysForUser = function (userID) {
    return storage.getAllGatewaysForUser(userID);
};
