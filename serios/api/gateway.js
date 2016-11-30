/**
 * This file handles all logic concerning gateways.
 *
 * This includes API logic as well as calling the storage.
 */
var checkPermission = require("./permissionchecker").checkPermission;
var AuthorizationError = require("./permissionchecker").AuthorizationError;

var storage = require("../core/storage");
var NotFoundError = require("../core/storage").NotFoundError;
var NoDataFoundError = require("../core/storage").NoDataFoundError;

var ValidationError = require("mongoose").Error.ValidationError;

module.exports = {
    add: add,
    update: update,
    get: get,
    remove: remove,

    getAllGatewaysForUser: getAllGatewaysForUser
};

/**
 * Handles a HTTP request for adding a Gateway.
 * It handles the following cases in this order:
 *
 * The user-authorization is checked,
 * the gateway is validated,
 * and the gateway is saved to the storage.
 *
 * If anyone of these steps fail the process is aborted and a specific HTTP status code and message is sent.
 *
 * A resolved {Promise} is returned as the request sends a HTTP response for every case.
 *
 * @param req Represents the HTTP request with its headers and parameters. This request is handled in this function.
 * @param res Represents the HTTP response this function sends when it gets the HTTP request.
 * @returns {Promise} A Promise to be resolved.
 */
function add(req, res) {
    var gateway = req.body;
    var authorization = req.headers.authorization;

    return checkPermission(authorization).then(function (userID) {
        gateway.ownerID = userID;
        return validateSyntax(gateway);
    }).then(function () {
        return addGateway(gateway);
    }).then(function (gatewayID) {
        res.status(200).json({gatewayID: gatewayID, msg: "OK. Gateway was added."});
    }).catch(function (err) {
        if (err instanceof AuthorizationError) {
            res.status(403).json({msg: "Forbidden. Access was denied!"});
        } else if (err instanceof ValidationError) {
            res.status(400).json({msg: "Bad Request. Bad syntax used for Gateway."});
        } else {
            res.status(500).json({msg: "Unknown Internal Server error.\n Error: " + err});
        }
    });
}

/**
 * Handles a HTTP request for updating a Gateway.
 * It handles the following cases in this order:
 *
 * The user-authorization is checked,
 * the gateway is validated,
 * and the gateway is updated in the storage.
 *
 * If anyone of these steps fail the process is aborted and a specific HTTP status code and message is sent.
 *
 * A resolved {Promise} is returned as the request sends a HTTP response for every case.
 *
 * @param req Represents the HTTP request with its headers and parameters. This request is handled in this function.
 * @param res Represents the HTTP response this function sends when it gets the HTTP request.
 * @returns {Promise} A Promise to be resolved.
 */
function update(req, res) {
    var gateway = req.body;
    var authorization = req.headers.authorization;
    var gatewayID = req.params.gatewayID;

    return checkPermission(authorization).then(function (userID) {
        gateway.ownerID = userID;
        return validateSyntax(gateway);
    }).then(function () {
        return updateGateway(gatewayID, gateway);
    }).then(function (gatewayID) {
        res.status(200).json({gatewayID: gatewayID, msg: "OK. Gateway was modified."});
    }).catch(function (err) {
        if (err instanceof AuthorizationError) {
            res.status(403).json({msg: "Forbidden. Access was denied!"});
        } else if (err instanceof ValidationError) {
            res.status(400).json({msg: "Bad Request. Bad syntax used for Gateway."});
        } else if (err instanceof NotFoundError) {
            res.status(400).json({msg: "Bad Request: Could not find Gateway."});
        } else {
            res.status(500).json({msg: "Unknown Internal Server error.\n Error: " + err});
        }
    });
}

/**
 * Handles a HTTP request for getting the description of a Gateway.
 * It handles the following cases in this order:
 *
 * The user-authorization is checked,
 * and the gateway is queried from the storage and returned.
 *
 * If anyone of these steps fail the process is aborted and a specific HTTP status code and message is sent.
 *
 * A resolved {Promise} is returned as the request sends a HTTP response for every case.
 *
 * @param req Represents the HTTP request with its headers and parameters. This request is handled in this function.
 * @param res Represents the HTTP response this function sends when it gets the HTTP request.
 * @returns {Promise} A Promise to be resolved.
 */
function get(req, res) {
    var authorization = req.headers.authorization;
    var gatewayID = req.params.gatewayID;

    return checkPermission(authorization).then(function () {
        return getGateway(gatewayID);
    }).then(function (gateway) {
        res.status(200).json(gateway);
    }).catch(function (err) {
        if (err instanceof AuthorizationError) {
            res.status(403).json({msg: "Forbidden. Access was denied!"});
        } else if (err instanceof NotFoundError) {
            res.status(400).json({msg: "Bad Request: Could not find Gateway."});
        } else {
            res.status(500).json({msg: "Unknown Internal Server error.\n Error: " + err});
        }
    });
}

/**
 * Handles a HTTP request for removing Gateways.
 * It handles the following cases in this order:
 *
 * The user-authorization is checked,
 * and the gateway is removed from the storage.
 *
 * If anyone of these steps fail the process is aborted and a specific HTTP status code and message is sent.
 *
 * A resolved {Promise} is returned as the request sends a HTTP response for every case.
 *
 * @param req Represents the HTTP request with its headers and parameters. This request is handled in this function.
 * @param res Represents the HTTP response this function sends when it gets the HTTP request.
 * @returns {Promise} A Promise to be resolved.
 */
function remove(req, res) {
    var authorization = req.headers.authorization;
    var gatewayID = req.params.gatewayID;

    return checkPermission(authorization).then(function () {
        return removeGateway(gatewayID);
    }).then(function () {
        res.status(200).json({msg: "OK. Gateway was removed."});
    }).catch(function (err) {
        if (err instanceof AuthorizationError) {
            res.status(403).json({msg: "Forbidden. Access was denied!"});
        } else if (err instanceof NotFoundError) {
            res.status(400).json({msg: "Bad Request. Could not find Gateway."});
        } else {
            res.status(500).json({msg: "Unknown Internal Server error.\n Error: " + err});
        }
    });
}

/**
 * Handles a HTTP request for getting all Gateways for a User.
 * It handles the following cases in this order:
 *
 * The user-authorization is checked,
 * and the gateways are queried from the storage and returned.
 *
 * If anyone of these steps fail the process is aborted and a specific HTTP status code and message is sent.
 *
 * A resolved {Promise} is returned as the request sends a HTTP response for every case.
 *
 * @param req Represents the HTTP request with its headers and parameters. This request is handled in this function.
 * @param res Represents the HTTP response this function sends when it gets the HTTP request.
 * @returns {Promise} A Promise to be resolved.
 */
function getAllGatewaysForUser(req, res) {
    var authorization = req.headers.authorization;

    return checkPermission(authorization).then(function (userID) {
        return allGatewaysForUser(userID);
    }).then(function (gateways) {
        res.status(200).json(gateways);
    }).catch(function (err) {
        if (err instanceof AuthorizationError) {
            res.status(403).json({msg: "Forbidden. Access was denied!"});
        } else if (err instanceof NoDataFoundError) {
            res.status(400).json({msg: "Bad Request. Could not find Gateways for User"});
        } else {
            res.status(500).json({msg: "Unknown Internal Server error.\n Error: " + err});
        }
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
