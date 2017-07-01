var w = require('winston');
w.level = process.env.LOG_LEVEL;

var settings = require('./../settings.js').security;

function init() {
    return Promise.resolve();
}

var checkAuth = function(req, res, next) {
    next();
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
    next();
}

var checkCreateEntity = function(userInfo, type) {
    w.debug("SERIOS.security.checkCreateEntity('"+userInfo+"')");
    
    return Promise.resolve({ grant: true });
}

var createEntity = function(userInfo, object, type) {
    w.debug("SERIOS.security.createEntity('"+userInfo+"', '"+object+"')");
    
    return Promise.resolve();
}

var checkCreateData = function(userInfo) {
    // Don't do anything here, the soID is contained
    // in the data set, thus, it can be linked to the
    // SO and its policy (this is not the way to go
    // but a first step to a proper realization)
    
    w.debug("SERIOS.security.checkCreateData('"+userInfo+"')");
    
    return Promise.resolve({ grant: true });
}

var createData = function(userInfo, object) {
    w.debug("SERIOS.security.createData('"+userInfo+"', '"+object+"')");
    
    return Promise.resolve();
}

var checkDelete = function(userID, objectID, type) {
    w.debug("SERIOS.security.checkDelete('"+userID+"', '"+objectID+"')");
    
    return Promise.resolve({ grant: true });
}

var postDelete = function(userID, objectID, type) {
    w.debug("SERIOS.security.postDelete('"+userID+"', '"+objectID+"')");
    
    return Promise.resolve();
}

var checkRead = function(userInfo, object, type) {
    w.debug("SERIOS.security.checkRead('"+userInfo.id+"', '"+object.id+"')");

    // for now, only retrieve the current policy
    // specified for the service object and check
    // the policy - maybe don't do anything but simply
    // declassify

    return Promise.resolve({ grant: true });
}

var checkWrite = function(userInfo, objectID, type) {
    w.debug("SERIOS.security.checkWrite('"+userInfo.id+"', '"+objectID+"')");

    return Promise.resolve({ grant: true });
}

var declassify = function(userInfo, object, type) {
    w.debug("SERIOS.security.declassify('"+userInfo.id+"', '"+object.id+"')");

    // for now, only retrieve the current policy
    // specified for the service object and check
    // the policy

    return Promise.resolve(object);
}

module.exports = {
    init: init,
    checkCreateEntity: checkCreateEntity,
    createEntity: createEntity,
    checkCreateData: checkCreateData,
    createData: createData,
    checkDelete: checkDelete,
    postDelete: postDelete,
    checkRead: checkRead,
    checkWrite: checkWrite,
    declassify: declassify,
    checkAuth: checkAuth,
    checkAuthOrToken: checkAuth,
    checkPermission: checkPermission
}
