/**
 * This file handles all logic concerning service objects.
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

    checkToken: checkToken,
    getAllSoForGateway: getAllSoForGateway,
    getAllSoForUser: getAllSoForUser

};

function add(req, res) {
    var so = req.body;
    var userID;

    if(req.user && req.user.id)
        userID = req.user.id;
    else {
        res.status(401).json({msg: "Request unauthorized."});
        return;
    }
    so.ownerID = userID;

    // TODO: ensure validation again after adjustment to servioticy format
    // TODO: reorganize catches
    // validateSyntax(so);
    Promise.resolve().catch(function (err) {
        res.status(400).json({msg: "Bad Request. Bad syntax used for Service Object."});
    }).then(function () {
        return addSO(so);
    }).then(function (r) {
        res.status(200).json({soID: r.soID, gatewayID: r.gatewayID, api_token: r.api_token});
    }).catch(function (err) {
        res.status(507).json({msg: err});
    });
}

function checkToken(req, res) {
    var soID = req.params.soID;
    
    var token = null;
    if(req.headers.authorization)
        token = req.headers.authorization.slice(7);
    if(token === null)
        return Promise.resolve(false);
    
    return new Promise(function(resolve, reject) {
        getSO(soID).then(function(so) {
            if(so.api_token === token) {
                req.validtoken = token;
                hasToken = true;
            } else {
                req.validtoken = null;
                req.so = so;
                hasToken = false;
            }
            resolve(hasToken);
        }).catch(function(err) {
            // most likely, SO with soID does not exist
            reject();
        });
    });
};

function update(req, res) {
    var authorization = req.headers.authorization;
    var soID = req.params.soID;
    var so = req.body;

    checkPermission(authorization).catch(function () {
        res.status(403).json({msg: "Forbidden. Access was denied!"});
    }).then(function (userID) {
        so.ownerID = userID;
        return validateSyntax(so);
    }).catch(function () {
        res.status(400).json({msg: "Bad Request. Bad syntax used for Service Object."});
    }).then(function () {
        return updateSO(soID, so);
    }).catch(function () {
        res.status(507).json({msg: "Insufficient Storage. Could not save Service Object."});
    }).then(function (res) {
        res.status(200).json({soID: res.soID, gatewayID: res.gatewayID, msg: "OK. Service Object was modified."});
    });
}

function get(req, res) {
    var authorization = req.headers.authorization;
    var soID = req.params.soID;

    checkPermission(authorization).catch(function () {
        res.status(403).json({msg: "Forbidden. Access was denied!"});
    }).then(function () {
        return getSO(soID);
    }).then(function (so) {
        res.status(200).json(so);
    }).catch(function(err) {
        if(err) {
            res.status(500).json({msg: "The server has a problem with your request. Please contact the system administrator." });
            console.log(err);
        } else
            res.status(400).json({msg: "Bad Request. Could not find Service Object."});
    });
}

function remove(req, res) {
    var soID = req.params.soID;
    var userID;

    if(req.user && req.user.id)
        userID = req.user.id;
    else {
        res.status(401).json({msg: "Request unauthorized."});
        return;
    }

    checkPermission(userID, soID).then(function () {
        return removeSO(soID);
    }).then(function () {
        res.status(200).json({msg: "OK. Service Object was removed."});
    }).catch(function (err) {
        res.status(400).json({msg: "Bad Request. Could not find Service Object."});
        // res.status(403).json({msg: "Forbidden. Access was denied!"});
    })
}

function getAllSoForGateway(req, res) {
    var authorization = req.headers.authorization;
    var gatewayID = req.params.gatewayID;

    checkPermission(authorization).catch(function () {
        res.status(403).json({msg: "Forbidden. Access was denied!"});
    }).then(function () {
        return allSoForGateway(gatewayID);
    }).catch(function () {
        res.status(400).json({msg: "Bad Request. Could not find Service Objects for given parameters."});
    }).then(function (sos) {
        res.status(200).json(sos);
    });
}

function getAllSoForUser(req, res) {
    var userID;

    if(req.user && req.user.id)
        userID = req.user.id;
    else {
        res.status(401).json({msg: "Request unauthorized."});
        return;
    }

    allSoForUser(userID).then(function (sos) {
        res.status(200).json(sos);
    }).catch(function () {
        res.status(400).json({msg: "Bad Request. Could not find Service Objects for given parameters."});
    })
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