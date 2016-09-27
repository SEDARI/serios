/**
 * This file handles all logic concerning service objects.
 *
 * This includes API logic as well as calling the storage.
 */
var permissionChecker = require("./permissionchecker");
var storage = require("../core/storage");

module.exports = {
    add: add,
    update: update,
    remove: remove,

    getAllSoForGateway: getAllSoForGateway,
    getAllSoForUser: getAllSoForUser

};

function add(req, res) {
    permissionChecker.checkPermission(req).catch(function () {
        res.status(403).json({msg: "Forbidden. Missing authentication."});
    }).then(validateSyntax(req.body)).catch(function () {
        res.status(400).json({msg: "Bad Request. Bad syntax used for Service Object."});
    }).then(addSO(req.body)).catch(function () {
        res.status(507).json({msg: "Insufficient Storage. Could not save Service Object."});
    }).then(function (soID) {
        res.status(200).json({soID: soID, msg: "OK. Service Object was added."});
    });
}

function update(req, res) {
    permissionChecker.checkPermission(req).catch(function () {
        res.status(403).json({msg: "Forbidden. Missing authentication."});
    }).then(validateSyntax(req.body)).catch(function () {
        res.status(400).json({msg: "Bad Request. Bad syntax used for Service Object."});
    }).then(updateSO(req.params.soID, req.body)).catch(function () {
        res.status(507).json({msg: "Insufficient Storage. Could not save Service Object."});
    }).then(function () {
        res.status(200).json({msg: "OK. Service Object was modified."});
    });
}

function remove(req, res) {
    permissionChecker.checkPermission(req).catch(function () {
        res.status(403).json({msg: "Forbidden. Missing authentication."});
    }).then(removeSO(req.params.soID)).catch(function () {
        res.status(400).json({msg: "Bad Request. Could not find Service Object."});
    }).then(function () {
        res.status(200).json({msg: "OK. Service Object was removed."});
    });
}

function getAllSoForGateway(req, res) {
    permissionChecker.checkPermission(req).catch(function () {
        res.status(403).json({msg: "Forbidden. Missing authentication."})
    }).then(allSoForGateway(req.params.gatewayID)).catch(function () {
        // TODO Phil 13/09/16: handle error
    }).then(function (sos) {
        res.status(200).json({sos: sos});
    });
}

function getAllSoForUser(req, res) {
    permissionChecker.checkPermission(req).catch(function () {
        res.status(403).json({msg: "Forbidden. Missing authentication."});
    }).then(allSoForUser(req.get('Authorization'))).catch(function () {
        // TODO Phil 13/09/16: handle error
    }).then(function (sos) {
        res.status(200).json({sos: sos});
    });
}


/**
 * Calls the storage to validate the syntax of a given service object.
 *
 * @param so the given service object.
 * @returns {Promise}
 */
var validateSyntax = new function (so) {
    return storage.validateServiceObjectSyntax(so);
};

/**
 * Calls the storage to add a given service object.
 *
 * @param so the service object that is added.
 * @returns {Promise}
 */
var addSO = new function (so) {
    return storage.addServiceObject(so);
};

/**
 * Calls the storage to update a given service object.
 *
 * @param soID the identifier of the service object that is updated.
 * @param so the new values of the service object.
 * @returns {Promise}
 */
var updateSO = new function (soID, so) {
    return storage.updateServiceObject(soID, so);
};

/**
 * Calls the storage to remove a given service object.
 *
 * @param soID the service object that is removed.
 * @returns {Promise}
 */
var removeSO = new function (soID) {
    return storage.removeServiceObject(soID);
};

/**
 * Calls the storage to return all service objects for a given gateway.
 *
 * @param gatewayID the identifier of the gateway.
 * @returns {Promise}
 */
var allSoForGateway = new function (gatewayID) {
    return storage.getAllSoForGateway(gatewayID);
};

/**
 * Calls the storage to return all service objects for a given user.
 *
 * @param userID the identifier of the user.
 * @returns {Promise}
 */
var allSoForUser = new function (userID) {
    return storage.getAllSoForUser(userID);
};
