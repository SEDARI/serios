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

    getAllSoForGateway: getAllSoForGateway,
    getAllSoForUser: getAllSoForUser

};

function add(req, res) {
    var authorization = req.headers.authorization;
    var so = req.body;

    checkPermission(authorization).catch(function () {
        res.status(403).json({msg: "Forbidden. Access was denied!"});
    }).then(function (userID) {
        so.ownerID = userID;
        return validateSyntax(so);
    }).catch(function () {
        res.status(400).json({msg: "Bad Request. Bad syntax used for Service Object."});
    }).then(function () {
        return addSO(so);
    }).then(function (result) {
        res.status(200).json({soID: result.soID, gatewayID: result.gatewayID, msg: "OK. Service Object was added."});
    }).catch(function () {
        res.status(507).json({msg: "Insufficient Storage. Could not save Service Object."});
    });
}

function update(req, res) {
    var authorization = req.headers.authorization;
    var soID = req.params.soID;
    var so = req.body;

    // TODO Phil 21/11/16: continue here
    // the second and third catch clauses are called as well. This is not intended. Change this. Please!

    // checkPermission(authorization).then(function (userID) {
    //     so.ownerID = userID;
    //     return validateSyntax(so);
    // }).then(function () {
    //     return updateSO(soID, so);
    // }).then(function (result) {
    //     res.status(200).json({soID: result.soID, gatewayID: result.gatewayID, msg: "OK. Service Object was modified."});
    // }).catch(function (err) {
    //     if (typeof err == AuthorizationError) {
    //         res.status(403).json({msg: "Forbidden. Access was denied!"});
    //     } else if (typeof err == ValidationError) {
    //         res.status(400).json({msg: "Bad Request. Bad syntax used for Service Object."});
    //     } else if (typeof err == ObjectNotFoundError) {
    //         res.status(400).json({msg: "Could not find Service Object."});
    //     } else {
    //         res.status(500).json({msg: "Unknown Internal Server error.\n Error: " + err});
    //     }
    // });

    checkPermission(authorization).catch(function () {
        res.status(403).json({msg: "Forbidden. Access was denied!"});
    }).then(function (userID) {
        so.ownerID = userID;
        return validateSyntax(so);
    }).catch(function () {
        res.status(400).json({msg: "Bad Request. Bad syntax used for Service Object."});
    }).then(function () {
        return updateSO(soID, so);
    }).then(function (result) {
        res.status(200).json({soID: result.soID, gatewayID: result.gatewayID, msg: "OK. Service Object was modified."});
    }).catch(function () {
        res.status(400).json({msg: "Could not find Service Object."});
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
        }).catch(function () {
            res.status(400).json({msg: "Bad Request. Could not find Service Object."});
        });
    }

    function remove(req, res) {
        var authorization = req.headers.authorization;
        var soID = req.params.soID;

        checkPermission(authorization).catch(function () {
            res.status(403).json({msg: "Forbidden. Access was denied!"});
        }).then(function () {
            return removeSO(soID);
        }).catch(function () {
            res.status(400).json({msg: "Bad Request. Could not find Service Object."});
        }).then(function () {
            res.status(200).json({msg: "OK. Service Object was removed."});
        });
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
        var authorization = req.headers.authorization;

        checkPermission(authorization).catch(function () {
            res.status(403).json({msg: "Forbidden. Access was denied!"});
        }).then(function (userID) {
            return allSoForUser(userID);
        }).catch(function () {
            res.status(400).json({msg: "Bad Request. Could not find Service Objects for given parameters."});
        }).then(function (sos) {
            res.status(200).json(sos);
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
