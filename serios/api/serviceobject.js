/*
This file handles all logic concerning service objects used in the API.
 */
var permissionChecker = require("./permissionchecker");
var handler = require('../api-handler/serviceobject');

module.exports = {
    add: add,
    update: update,
    remove: remove
};

function add(req, res) {
    permissionChecker.checkPermission(req).catch(function () {
        res.status(403).json({msg: "Forbidden. Missing authentication."})
    }).then(validateSyntax(req)).catch(function () {
        res.status(400).json({msg: "Bad Request. Bad syntax used for Service Object."})
    }).then(handler.add(req.body)).catch(function () {
        res.status(507).json({msg: "Insufficient Storage. Could not save Service Object."})
    }).then(function (soID) {
        res.status(200).json({soID: soID}, {msg: "OK. Service Object was added."});
    });
}

function update(req, res) {
    permissionChecker.checkPermission(req).catch(function () {
        res.status(403).json({msg: "Forbidden. Missing authentication."})
    }).then(validateSyntax).catch(function () {
        res.status(400).json({msg: "Bad Request. Bad syntax used for Service Object."})
    }).then(handler.update(req.params.soID, req.body)).catch(function () {
        res.status(507).json({msg: "Insufficient Storage. Could not save Service Object."})
    }).then(function () {
        res.status(200).json({msg: "OK. Service Object was modified."})
    });
}

function remove(req, res) {
    permissionChecker.checkPermission(req).catch(function () {
        res.status(403).json({msg: "Forbidden. Missing authentication."})
    }).then(handler.remove(req.params.soID)).catch(function () {
        res.status(400).json({msg: "Bad Request. Could not find Service Object."})
    }).then(function () {
        res.status(200).json({msg: "OK. Service Object was removed."})
    });
}

function validateSyntax(req) {
    return new Promise(function (resolve, reject) {
        // TODO Phil: 11/09/16 add additional validation.
        if (req.is("json")) {
            resolve();
        } else {
            reject();
        }
    });
}

