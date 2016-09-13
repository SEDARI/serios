/*
 This file handles all authentication checking used in the API using promises.

 It serves as wrapper of the identity management which uses callbacks.
 */
module.exports = {
    checkPermission: function () {
        return new Promise(function (resolve, reject) {
            // this is a dummy version for later authentication
            // We will use identity management from Juan David
            return resolve();
        });
    }
};
