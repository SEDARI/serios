var w = require('winston');
w.level = process.env.LOG_LEVEL;

var settings = require('./../settings.js').security;

function init() {
    return Promise.resolve();
}

var checkAuth = function(req, res, next) {
    // TODO: check whether ensured-login would be a better choice
    if(req.user) {
        next();
    } else {
        console.log("check bearer");
        // passport.authenticate('agile-bearer', {session: false})(req, res, next);
        next();
    }
};

var checkAuthOrToken = function(req, res, next) {
    // TODO: as above - check correctness
    if(req.user) {
        next();
    } else {
        serviceObject.checkToken(req, res).then(function(hasToken) {
            if(hasToken)
                next();
            else
                // passport.authenticate('agile-bearer', {session: false})(req, res, next);
                next();
        }, function(err) {
            res.status(403).end();
        });
    }
}

var checkPermission = function(req, res, next) {
    // TODO: check flow contorl permission on SO
    // TODO: Ensure that requests with access_token can always pass
    
    // default behaviour: accept
    next();
}

var checkCreate = function(userInfo, type) {
    w.debug("serios.security.checkCreate('"+userInfo+"')");
    
    return Promise.resolve({ grant: true });
}

var createEntity = function(userInfo, object, type) {
    w.debug("serios.security.createEntity('"+userInfo+"', '"+object+"')");
    
    return Promise.resolve();
}

var checkDelete = function(userID, objectID, type) {
    w.debug("serios.security.checkDelete('"+userID+"', '"+objectID+"')");
    
    return Promise.resolve({ grant: true });
}

var postDelete = function(userID, objectID, type) {
    w.debug("serios.security.postDelete('"+userID+"', '"+objectID+"')");
    
    return Promise.resolve();
}

var checkRead = function(userInfo, object, type) {
    w.debug("serios.security.checkRead('"+userInfo.id+"', '"+object.id+"')");

    // use upfront with user and object info

    return Promise.resolve({ grant: true });
}

var checkWrite = function(userInfo, objectID, type) {
    w.debug("serios.security.checkWrite('"+userInfo.id+"', '"+objectID+"')");

    return Promise.resolve({ grant: true });
}

var declassify = function(userInfo, object, type) {
    w.debug("serios.security.declassify('"+userInfo.id+"', '"+object.id+"')");

    return Promise.resolve(object);
}

module.exports = {
    init: init,
    checkCreate: checkCreate,
    createEntity: createEntity,
    checkDelete: checkDelete,
    postDelete: postDelete,
    checkRead: checkRead,
    checkWrite: checkWrite,
    declassify: declassify,
    checkAuth: checkAuth,
    checkAuthOrToken: checkAuth,
    checkPermission: checkPermission
}
