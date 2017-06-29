/**
 * This file handles all authorization checking used in the API using promises.
 */
module.exports = {
    /**
     * Check if the given authorization token is valid.
     * If yes, return the userID.
     * If not, throw an AuthorizationError.
     *
     * @param authorization_token
     * @throws {AuthorizationError}
     * @returns {Promise}
     */
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
    /**
     * Constructs a new AuthorizationError with a given message.
     * This error is a subclass of Error.
     *
     * This error should be thrown when the authorization failed.
     *
     * @param message the message of the error.
     * @constructor
     */
    AuthorizationError : AuthorizationError
};

/**
 * Constructs a new AuthorizationError with a given message.
 * This error is a subclass of Error.
 *
 * This error should be thrown when the authorization failed.
 *
 * @param message the message of the error.
 * @constructor
 */
function AuthorizationError(message) {
    this.name = "AuthorizationError";
    this.message = (message || "");
}
AuthorizationError.prototype = new Error();
