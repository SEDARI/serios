/*
 This file handles all authentication checking used in the API using promises.

 It serves as wrapper of the identity management which uses callbacks.
 */
module.exports = {
    checkPermission: function (authorization_token) {
        return new Promise(function (resolve, reject) {
            // this is a dummy version for later authentication
            // We will use identity management from Juan David
            if (authorization_token) {
                resolve(authorization_token);
            } else {
                reject(new AuthorizationError("Authorization failed."));
            }
        });
    },
    AuthorizationError : AuthorizationError
};
function AuthorizationError(message) {
    this.name = "AuthorizationError";
    this.message = (message || "");
}
AuthorizationError.prototype = new Error();

