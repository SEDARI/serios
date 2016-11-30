/**
 * This file handles all logic concerning service objects.
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

    getAllSoForGateway: getAllSoForGateway,
    getAllSoForUser: getAllSoForUser
};

/**
 * Handles a HTTP request for adding a Service Object.
 * It handles the following cases in this order:
 *
 * The user-authorization is checked,
 * the service object is validated,
 * and the service object is saved to the storage.
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
    var authorization = req.headers.authorization;
    var so = req.body;

    return checkPermission(authorization).then(function (userID) {
        so.ownerID = userID;
        return validateSyntax(so);
    }).then(function () {
        return addSO(so);
    }).then(function (result) {
        res.status(200).json({soID: result.soID, gatewayID: result.gatewayID, msg: "OK. Service Object was added."});
    }).catch(function (err) {
        if (err instanceof AuthorizationError) {
            res.status(403).json({msg: "Forbidden. Access was denied!"});
        } else if (err instanceof ValidationError) {
            res.status(400).json({msg: "Bad Request. Bad syntax used for Service Object."});
        } else if (err instanceof NotFoundError) {
            res.status(400).json({msg: "Bad: Request. Could not find given Gateway."});
        } else {
            res.status(500).json({msg: "Unknown Internal Server error.\n Error: " + err});
        }
    });
}

/**
 * Handles a HTTP request for updating a Service Object.
 * It handles the following cases in this order:
 *
 * The user-authorization is checked,
 * the service object is validated,
 * and the service object is updated in the storage.
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
    var authorization = req.headers.authorization;
    var soID = req.params.soID;
    var so = req.body;

    return checkPermission(authorization).then(function (userID) {
        so.ownerID = userID;
        return validateSyntax(so);
    }).then(function () {
        return updateSO(soID, so);
    }).then(function (result) {
        res.status(200).json({soID: result.soID, gatewayID: result.gatewayID, msg: "OK. Service Object was modified."});
    }).catch(function (err) {
        if (err instanceof AuthorizationError) {
            res.status(403).json({msg: "Forbidden. Access was denied!"});
        } else if (err instanceof ValidationError) {
            res.status(400).json({msg: "Bad Request. Bad syntax used for Service Object."});
        } else if (err instanceof NotFoundError) {
            res.status(400).json({msg: "Bad Request. Could not find Service Object."});
        } else if (err instanceof NoDataFoundError) {
            res.status(400).json({msg: "Bad Request. Could not find given Gateway."});
        } else {
            res.status(500).json({msg: "Unknown Internal Server error.\n Error: " + err});
        }
    });
}

/**
 * Handles a HTTP request for getting the description of a Service Object.
 * It handles the following cases in this order:
 *
 * The user-authorization is checked,
 * and the service object is queried from the storage and returned.
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
    var soID = req.params.soID;

    return checkPermission(authorization).then(function () {
        return getSO(soID);
    }).then(function (so) {
        res.status(200).json(so);
    }).catch(function (err) {
        if (err instanceof AuthorizationError) {
            res.status(403).json({msg: "Forbidden. Access was denied!"});
        } else if (err instanceof NotFoundError) {
            res.status(400).json({msg: "Bad Request. Could not find Service Object."});
        } else {
            res.status(500).json({msg: "Unknown Internal Server error.\n Error: " + err});
        }
    });
}

/**
 * Handles a HTTP request for removing Service Objects.
 * It handles the following cases in this order:
 *
 * The user-authorization is checked,
 * and the service object is removed from the storage.
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
    var soID = req.params.soID;

    return checkPermission(authorization).then(function () {
        return removeSO(soID);
    }).then(function () {
        res.status(200).json({msg: "OK. Service Object was removed."});
    }).catch(function (err) {
        if (err instanceof AuthorizationError) {
            res.status(403).json({msg: "Forbidden. Access was denied!"});
        } else if (err instanceof NotFoundError) {
            res.status(400).json({msg: "Bad Request. Could not find Service Object."});
        } else {
            res.status(500).json({msg: "Unknown Internal Server error.\n Error: " + err});
        }
    });
}

/**
 * Handles a HTTP request for getting all Service Objects for a Gateway.
 * It handles the following cases in this order:
 *
 * The user-authorization is checked,
 * and the service objects are queried from the storage and returned.
 *
 * If anyone of these steps fail the process is aborted and a specific HTTP status code and message is sent.
 *
 * A resolved {Promise} is returned as the request sends a HTTP response for every case.
 *
 * @param req Represents the HTTP request with its headers and parameters. This request is handled in this function.
 * @param res Represents the HTTP response this function sends when it gets the HTTP request.
 * @returns {Promise} A Promise to be resolved.
 */
function getAllSoForGateway(req, res) {
    var authorization = req.headers.authorization;
    var gatewayID = req.params.gatewayID;

    return checkPermission(authorization).then(function () {
        return allSoForGateway(gatewayID);
    }).then(function (sos) {
        res.status(200).json(sos);
    }).catch(function (err) {
        if (err instanceof AuthorizationError) {
            res.status(403).json({msg: "Forbidden. Access was denied!"});
        } else if (err instanceof NotFoundError) {
            res.status(400).json({msg: "Bad Request. Could not find Gateway."});
        } else if (err instanceof NoDataFoundError) {
            res.status(400).json({msg: "Bad Request. Could not find Service Objects for given Gateway."});
        } else {
            res.status(500).json({msg: "Unknown Internal Server error.\n Error: " + err});
        }
    });
}

/**
 * Handles a HTTP request for getting all Service Objects for a User.
 * It handles the following cases in this order:
 *
 * The user-authorization is checked,
 * and the service objects are queried from the storage and returned.
 *
 * If anyone of these steps fail the process is aborted and a specific HTTP status code and message is sent.
 *
 * A resolved {Promise} is returned as the request sends a HTTP response for every case.
 *
 * @param req Represents the HTTP request with its headers and parameters. This request is handled in this function.
 * @param res Represents the HTTP response this function sends when it gets the HTTP request.
 * @returns {Promise} A Promise to be resolved.
 */
function getAllSoForUser(req, res) {
    var authorization = req.headers.authorization;

    return checkPermission(authorization).then(function (userID) {
        return allSoForUser(userID);
    }).then(function (sos) {
        res.status(200).json(sos);
    }).catch(function (err) {
        if (err instanceof AuthorizationError) {
            res.status(403).json({msg: "Forbidden. Access was denied!"});
        } else if (err instanceof NoDataFoundError) {
            res.status(400).json({msg: "Bad Request. Could not find Service Objects for given parameters."});
        } else {
            res.status(500).json({msg: "Unknown Internal Server error.\n Error: " + err});
        }
    });
}

/**
 * Calls the storage to validate the syntax of a given service object.
 *
 * @param so the given service object.
 * @returns {Promise}
 */
var validateSyntax = function (so) {
    return storage.validateServiceObjectSyntax(so);
};

/**
 * Calls the storage to add a given service object.
 *
 * @param so the service object that is added.
 * @returns {Promise}
 */
var addSO = function (so) {
    return storage.addServiceObject(so);
};

/**
 * Calls the storage to update a given service object.
 *
 * @param soID the identifier of the service object that is updated.
 * @param so the new values of the service object.
 * @returns {Promise}
 */
var updateSO = function (soID, so) {
    return storage.updateServiceObject(soID, so);
};

/**
 * Calls the storage to get the description of a given service object.
 *
 * @param soID the identifier of the requested service object.
 * @returns {Promise}
 */
var getSO = function (soID) {
    return storage.getServiceObject(soID);
};

/**
 * Calls the storage to remove a given service object.
 *
 * @param soID the service object that is removed.
 * @returns {Promise}
 */
var removeSO = function (soID) {
    return storage.removeServiceObject(soID);
};

/**
 * Calls the storage to return all service objects for a given gateway.
 *
 * @param gatewayID the identifier of the gateway.
 * @returns {Promise}
 */
var allSoForGateway = function (gatewayID) {
    return storage.getAllSoForGateway(gatewayID);
};

/**
 * Calls the storage to return all service objects for a given user.
 *
 * @param userID the identifier of the user.
 * @returns {Promise}
 */
var allSoForUser = function (userID) {
    return storage.getAllSoForUser(userID);
};
