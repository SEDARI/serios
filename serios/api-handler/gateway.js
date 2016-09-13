/**
 * This file handles all the logic concerning gateways that isn't API logic.
 */
var storage = require("../storage");


module.exports = {
    add: addGateway,
    update: updateGateway,
    remove: removeGateway,

    getAllGatewaysForUser: getAllGatewaysForUser
};

/**
 * Calls the storage to add a given gateway.
 *
 * @param gateway the gateway that is added.
 * @returns {Promise}
 */
function addGateway(gateway) {
    return storage.addGateway(gateway);
}

/**
 * Calls the storage to update a given gateway.
 *
 * @param gatewayID the identifier of the gateway that is updated.
 * @param gateway the new values of the gateway.
 * @returns {Promise}
 */
function updateGateway(gatewayID, gateway) {
    return storage.updateGateway(gatewayID, gateway);
}

/**
 * Calls the storage to remove a given gateway.
 *
 * @param gatewayID the gateway that is removed.
 * @returns {Promise}
 */
function removeGateway(gatewayID) {
    return storage.removeGateway(gatewayID);
}

/**
 * Calls the storage to return all gateways for a given user.
 *
 * @param userID the identifier of the user.
 * @returns {*}
 */
function getAllGatewaysForUser(userID) {
    return storage.getAllSoForUser(userID);
}

