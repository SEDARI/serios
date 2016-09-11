/*
 * This file handles all the logic concerning service objects that isn't API logic.
 */
var storage = require("../storage");

module.exports = {
    add: addServiceObject,
    update: updateServiceObject,
    remove: removeServiceObject
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
