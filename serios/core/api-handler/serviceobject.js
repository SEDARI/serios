/**
 * This file handles all the logic concerning service objects that isn't API logic.
 */
var storage = require("../storage");

module.exports = {
    add: addServiceObject,
    update: updateServiceObject,
    remove: removeServiceObject,

    getAllSoForGateway: getAllSoForGateway,
    getAllSoForUser: getAllSoForUser
};

/**
 * Calls the storage to add a given service object.
 *
 * @param so the service object that is added.
 * @returns {Promise}
 */
function addServiceObject(so) {
    return storage.addServiceObject(so);
}

/**
 * Calls the storage to update a given service object.
 *
 * @param soID the identifier of the service object that is updated.
 * @param so the new values of the service object.
 * @returns {Promise}
 */
function updateServiceObject(soID, so) {
    return storage.updateServiceObject(soID, so);
}

/**
 * Calls the storage to remove a given service object.
 *
 * @param soID the service object that is removed.
 * @returns {Promise}
 */
function removeServiceObject(soID) {
    return storage.removeServiceObject(soID);
}

/**
 * Calls the storage to return all service objects for a given user.
 *
 * @param userID the identifier of the user.
 * @returns {*}
 */
function getAllSoForUser(userID) {
    return storage.getAllSoForUser(userID);
}

/**
 * Calls the storage to return all service objects for a given gateway.
 *
 * @param gatewayID the identifier of the gateway.
 * @returns {*}
 */
function getAllSoForGateway(gatewayID) {
    return storage.getAllSoForGateway(gatewayID);
}
