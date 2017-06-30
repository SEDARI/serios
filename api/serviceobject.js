/**
 * This file handles all logic concerning service objects.
 *
 * This includes API logic as well as calling the storage.
 */
var w = require('winston');
w.level = process.env.LOG_LEVEL;

var NotFoundError = require("../storage").NotFoundError;
var NoDataFoundError = require("../storage").NoDataFoundError;

var ValidationError = require("mongoose").Error.ValidationError;

var soDefaultPolicy = {
    flows: [
        // all properties can only be read by the owner of the entity
        {
            to: true,
            locks: [
                { lock: "isOwner" }
            ]
        },
        // all properties can only be changed by the owner of the entity
        {
            to: false,
            locks: [
                { lock: "isOwner" }
            ]
        },
        {
            to: false,
            locks: [
                { lock: "hasType", args: [ "/user" ] },
                { lock: "attrEq", args: ["role", "admin"] }
            ]
        }
    ]
};

var storage = require("../storage");

// TODO: Elaborate security (in relation to ulocks) and export functions which perform
// the appropriate security checks and potential declassifications

module.exports = function SO(security, tag) {
    function add(req, res) {
        var so = req.body;
        var userID;

        w.debug("SERIOS.api.add: Add new SO.");

        if(valid(req.user) && valid(req.user.id))
            so.owner = req.user.id;
        else {
            res.status(401).json({msg: "Request unauthorized."});
            return;
        }

        // TODO: add missing syntax validation
        security.checkCreate(req.user).then(function(d) {
            if(d.grant) {
                addSO(so).then(function (r) {
                    security.createEntity(req.user, r).then(function() {
                        res.status(200).json({id: r.id, gateway: r.gateway, api_token: r.api_token});
                    }, function(err) {
                        res.status(500).json({msg: err});
                    });            
                }, function (err) {
                    res.status(500).json({msg: err});
                });
            } else
                res.status(403).json({msg: "User is not allowed to create new service objects"});
        }, function(e) {
            res.status(500).json({msg: err});
        });
    }

    function update(req, res) {
        var soID = req.params.soID;
        var so = req.body;

        if(valid(req.user) && valid(req.user.id)) {
            so.owner = req.user.id;
        } else {
            res.status(401).json({msg: "Request unauthorized."});
            return;
        }

        // TODO: check semantics of update!
        // TODO: Check whether it is possible to check smaller updates (not the whole SO)
        security.checkWrite(req.user, so, "/sensor").then(function(d) {
            if(d.grant) {
                w.debug("SERIOS.api.update: Update SO '"+soID+"' with ", so);
                updateSO(soID, so).then(function(r) {
                    res.status(200).json({id: r.id, gatewayID: r.gateway, msg: "OK. Service Object was modified."});
                }, function(e) {
                    w.debug("SERIOS.api.update: ", e);
                    res.status(507).json({msg: "Insufficient Storage. Could not save Service Object."});
                });
            } else {
                res.status(403).json({msg: "Forbidden!"});
            }
        }, function(e) {
            w.error("Failed to check write access to SO '"+soID+"'");
            res.status(500).json({msg: "The server has a problem with your request. Please contact the system administrator." });            
        });
    };
                                                   

    function get(req, res) {
        var soID = req.params.soID;

        w.debug("SERIOS.api.get: Retrieve SO with id '"+soID+"'");
        
        if(!valid(req.user) || !valid(req.user.id)) {
            res.status(401).json({msg: "Request unauthorized."});
            return;
        }

        getSO(soID).then(function(so) {
            if(so !== null) {
                w.debug("SERIOS.api.get: Found SO with '"+soID+"', now checking read access.");
                try {
                    security.checkRead(req.user, so, "/sensor").then(function (d) {
                        if(d.grant === false) {
                            w.debug("Read access to SO '" + soID + "' for user '"+req.user.id+"' denied.");
                            res.status(403).json({msg: "Forbidden!"});
                        } else {
                            w.debug("Read access to SO '" + soID + "' for user '"+req.user.id+"' granted.");
                            security.declassify(req.user, so, "/sensor").then(function(decSO) {
                                w.debug("SO '" + soID + "' was declassified for user '"+req.user.id+"'");
                                res.status(200).json(decSO);
                            }, function(e) {
                                w.error(e);
                                res.status(500).json({msg: "The server has a problem with your request. Please contact the system administrator." });
                            });
                        }
                }, function(e) {
                    var m = "Failed to check read access on SO '"+soID+"'";
                    w.error(m);
                    res.status(500).json({msg: "The server has a problem with your request. Please contact the system administrator." });
                });
                } catch (e) {
                    console.log(e);
                }
            } else {
                w.debug("SERIOS.api.get: SO with id '"+soID+"' does not exist");
                res.status(400).json({msg: "Bad Request. Could not find Service Object."});
            }
        }, function(e) {
            w.error(e);
            res.status(500).json({msg: "The server has a problem with your request. Please contact the system administrator." });
        });
    }

    function remove(req, res) {
        var soID = req.params.soID;
        var userID;

        w.debug("SERIOS.api.remove: Remove SO with id '"+soID+"'");

        // check main policy whether writing is allowed

        if(valid(req.user) && valid(req.user.id))
            userID = req.user.id
        else {
            res.status(401).json({msg: "Request unauthorized."});
            return;
        }

        security.checkDelete(userID, soID).then(function(d) {
            if(d.grant === true) {
                removeSO(soID).then(function() {
                    security.postDelete(userID, soID).then(function() {
                        res.status(200).json({msg: "OK. Service Object was removed."});
                    }, function(e) {
                        // Only inform the admin about this problem for now
                        w.error("Unable to remove policy for service object with id '"+soID+"'");
                        res.status(200).json({msg: "OK. Service Object was removed."});
                    });
                }, function(err) {
                    if (err instanceof NotFoundError) {
                        res.status(400).json({msg: "Bad Request. Could not find Service Object."});
                    } else {
                        res.status(500).json({msg: "Unknown Internal Server error.\n Error: " + err});
                    }
                });
            } else {
                res.status(403).json({msg: "Forbidden. Access was denied!"});
            }
        }, function(e) {
            w.error("The security module caused a problem while checking permissions to delte the serviceobject with id '"+soID+"'");
            w.error(e);
            res.status(500).json({msg: "The server has a problem with your request. Please contact the system administrator." });
        });       
    }
    
    function getAllSoForGateway(req, res) {        
        var authorization = req.headers.authorization;
        var gatewayID = req.params.gatewayID;

        w.debug("SERIOS.api.getAllSoForGateway: '"+gatewayID+"'");

        allSoForGateway(gatewayID).then(function(sos) {
            res.status(200).json(sos);
        }, function (err) {
            res.status(400).json({msg: "Bad Request. Could not find Service Objects for given parameters."});
        });
    }

    function getAllSoForUser(req, res) {
        var userID;
        
        if(valid(req.user) && valid(req.user.id))
            userID = req.user.id;
        else {
            res.status(401).json({msg: "Request unauthorized."});
            return;
        }

        allSoForUser(userID).then(function (sos) {
            res.status(200).json(sos);
        }).catch(function () {
            res.status(400).json({msg: "Bad Request. Could not find Service Objects for given parameters."});
        });
    };

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

    function valid(o) {
        return o !== undefined && o !== null;
    }

    return {
        add: add,
        update: update,
        get: get,
        remove: remove,

        checkToken: checkToken,
        getAllSoForGateway: getAllSoForGateway,
        getAllSoForUser: getAllSoForUser
    };
};
