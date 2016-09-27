/**
 * This file handles all logic concerning gateways.
 *
 * This includes API logic as well as calling the storage.
 */

var permissionChecker = require("./permissionchecker");
var storage = require("../core/storage");

module.exports = {
    add: add,
    update: update,
    remove: remove,

    getAllGatewaysForUser: getAllGatewaysForUser
};


function add(req, res) {
    permissionChecker.checkPermission().catch(function () {
        res.status(403).json({msg: "Forbidden. Missing authentication."})
    }).then(validateSyntax(req.body)).catch(function () {
        res.status(400).json({msg: "Bad Request. Bad syntax used for Gateway."})
    }).then(addGateway(req.body)).catch(function () {
        res.status(507).json({msg: "Insufficient Storage. Could not save Gateway."})
    }).then(function (gatewayID) {
        res.status(200).json({gatewayID: gatewayID}, {msg: "OK. Gateway was added."});
    });
}

function update(req, res) {
    permissionChecker.checkPermission(req).catch(function () {
        res.status(403).json({msg: "Forbidden. Missing authentication."})
    }).then(validateSyntax(req)).catch(function () {
        res.status(400).json({msg: "Bad Request. Bad syntax used for Gateway."})
    }).then(updateGateway(req.params.gatewayID, req.body)).catch(function () {
        res.status(507).json({msg: "Insufficient Storage. Could not update Gateway."})
    }).then(function () {
        res.status(200).json({msg: "OK. Gateway was modified."})
    });
}

function remove(req, res) {
    permissionChecker.checkPermission(req).catch(function () {
        res.status(403).json({msg: "Forbidden. Missing authentication."})
    }).then(removeGateway(req.params.gatewayID)).catch(function () {
        res.status(400).json({msg: "Bad Request. Could not find Gateway."})
    }).then(function () {
        res.status(200).json({msg: "OK. Gateway was removed."})
    });
}

function getAllGatewaysForUser(req, res) {
    permissionChecker.checkPermission(req).catch(function () {
        res.status(403).json({msg: "Forbidden. Missing authentication."})
    }).then(allGatewaysForUser()).catch(function () {
        // TODO Phil 12/09/16: handle error
    });
}

/**
 * Calls the storage to validate the syntax of a given gateway.
 *
 * @param gateway the gateway that is validated.
 * @returns {Promise}
 */
var validateSyntax = new function (gateway) {
    return storage.validateGatewaySyntax(gateway);
};

/**
 * Calls the storage to add a given gateway.
 *
 * @param gateway the gateway that is added.
 * @returns {Promise}
 */
var addGateway = new function (gateway) {
    return storage.addGateway(gateway);
};

/**
 * Calls the storage to update a given gateway.
 *
 * @param gatewayID the identifier of the gateway that is updated.
 * @param gateway the new values of the gateway.
 * @returns {Promise}
 */
var updateGateway = new function (gatewayID, gateway) {
    return storage.updateGateway(gatewayID, gateway);
};

/**
 * Calls the storage to remove a given gateway.
 *
 * @param gatewayID the gateway that is removed.
 * @returns {Promise}
 */
var removeGateway = new function (gatewayID) {
    return storage.removeGateway(gatewayID);
};

/**
 * Calls the storage to return all gateways for a given user.
 *
 * @param userID the identifier of the user.
 * @returns {*}
 */
var allGatewaysForUser = new function (userID) {
    return storage.getAllSoForUser(userID);
};
