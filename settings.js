module.exports = {
    server : {
        tls : false,
        host : "127.0.0.1",
        port : 3000,
        cluster : 0
    },
    storage: {
        type: "mongodb",
        host: "localhost",
        port: "27017",
        dbname: "serios-database",
        user: "serios",
        password: "serios",
        max_number_of_sensor_data_saved : 10000,
        max_duration_of_sensor_data_saved: {
            value: 30,
            // one of 'seconds', 'minutes', 'hours', 'days'.
            timeunit: "days"
        },

        testdbname: "serios-test",
        testuser: "seriosTest",
        testpassword: "seriosTest"
    },
    oauth2: {
        authorizationURL: 'http://localhost:3000/idm/oauth2/dialog/authorize',
        tokenURL: 'http://localhost:3000/idm/oauth2/token',
        clientID: "SERIOS_Dashboard",
        clientSecret: "somesecret",
        callbackURL: "http://localhost:3000/idm/auth/callback",
        userInfoUrl: 'http://localhost:3000/idm/oauth2/api/userinfo',
    },
    ui : {
        "site": {
            "tls": {
                "key": "./certs/server.key",
                "cert": "./certs/server.crt"
            },
            "https_port": 1445,
            "http_port": 3002
        },
        "idm": {
            "host": "localhost",
            "port": 3000,
            "protocol": "http"
        }
    },
    idm : {
        core : {
            "storage": {
                "dbName": "db/database_"
            },
            "policies": {
                "dbName": "./policies.json",
                "create_entity_policy": [
                    // actions of an actor are not restricted a priori
                    {
                        target: {
                            type: "any"
                        }
                    }, {
                        source: {
                            type: "any"
                        }
                    }
                ],
                "top_level_policy": [
                    // all properties can be read by everyone
                    {
                        target: {
                            type: "any"
                        }
                    },
                    // all properties can only be changed by the owner of the entity
                    {
                        source: {
                            type: "user"
                        },
                        locks: [{
                            lock: "isOwner"
                        }]
                    }, {
                        source: {
                            type: "user"
                        },
                        locks: [{
                            lock: "attrEq",
                            args: ["role", "admin"]
                        }]
                    }
                ],
                "attribute_level_policies": {
                    "user": {
                        "password": [
                            // the property can only be read by the user itself
                            {
                                target: {
                                    type: "user"
                                },
                                locks: [{
                                    lock: "isOwner"
                                }]
                            },
                            // the property can be set by the user itself and
                            {
                                source: {
                                    type: "user"
                                },
                                locks: [{
                                    lock: "isOwner"
                                }]
                            },
                            // by all users with role admin
                            {
                                source: {
                                    type: "user"
                                },
                                locks: [{
                                    lock: "attrEq",
                                    args: ["role", "admin"]
                                }]
                            }
                        ],
                        "role": [
                            // can be read by everyone
                            {
                                target: {
                                    type: "any"
                                }
                            },
                            // can only be changed by users with role admin
                            {
                                source: {
                                    type: "user"
                                },
                                locks: [{
                                    lock: "attrEq",
                                    args: ["role", "admin"]
                                }]
                            }
                        ]
                    },
                    "sensor": {
                        "credentials": [
                            // the property can only be read by the user itself
                            {
                                target: {
                                    type: "user"
                                },
                                locks: [{
                                    lock: "isOwner"
                                }]
                            },
                            // the property can be set by the user itself and
                            {
                                source: {
                                    type: "user"
                                },
                                locks: [{
                                    lock: "isOwner"
                                }]
                            }
                        ]
                    }

                }
            },
            "schema-validation": [{
                "id": "/sensor",
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string"
                    },
                    "credentials": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "system": {
                                    "type": "string"
                                },
                                "value": {
                                    "type": "string"
                                }
                            }
                        }
                    }
                },
                "required": ["name"]
            }, {
                "id": "/user",
                "type": "object",
                "properties": {
                    "user_name": {
                        "type": "string"
                    },
                    "auth_type": {
                        "type": "string"
                    },
                    "password": {
                        "type": "string"
                    },
                    "role":{
                        "type":"string"
                    }
                },
                "required": ["user_name", "auth_type"]
            }, {
                "id": "/client",
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string"
                    },
                    "clientSecret": {
                        "type": "string"
                    },
                    "redirectURI": {
                        "type": "string"
                    }
                },
                "required": ["name", "clientSecret", "redirectURI"]
            }]
        },
        ui : {
            "gateway_id": "1",
            "token-storage": {
                "dbName": "./database_web",
                "createTables": true
            },
            "failureRedirect" : "/idm/login",
            "auth": {
                "github": {
                    "clientID": "getGithubId",
                    "clientSecret": "getGithubSecret",
                    "redirect_path": "http://localhost:3000/auth/callback_github",
                    "scope": [
                        "notifications"
                    ]
                },
                "dropbox": {
                    "clientID": "getDropboxId",
                    "clientSecret": "getDropboxSecret",
                    "redirect_path": "http://localhost:3000/auth/callback_dropbox",
                    "scope": [
                        ""
                    ]
                },
                "google": {
                    "clientID": "getGoogleId",
                    "clientSecret": "getGoogleSecret",
                    "redirect_path": "http://localhost:3000/auth/callback_google",
                    "scope": [
                        "https://www.googleapis.com/auth/drive",
                        "https://www.googleapis.com/auth/userinfo.profile",
                        "https://www.googleapis.com/auth/userinfo.email"
                    ]
                }
            },
            "tls": {
                "key": "./certs/server.key",
                "cert": "./certs/server.crt"
            },
            "enabledStrategies": ["agile-local", "github", "google", "webid"]
        }
    }
};
