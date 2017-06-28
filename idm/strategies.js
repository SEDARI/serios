var passport = require("passport");

var BearerStrategy = require('passport-http-bearer').Strategy;

var strategy = function (accesstoken, done) {
    done(null, accesstoken);
}

var apiTokenStrategy = new BearerStrategy(strategy, { passReqToCallback: true });

module.exports = {
    apiTokenStrategy: apiTokenStrategy
}
