module.exports = {
    server : {
        tls : false,
        host : "127.0.0.1",
        port : 3000
    },
    idm : {
        "gateway_id":"1",
        "token-storage":{
            "dbName":"./tokens.sqlite3",
            "createTables":true
        },
        "auth":{
            "response":{
                "success":{
                    "url":"/static/index.html",
                    "token":"query-params"
                },
                "fail":{
                    "url":"/static/error/error.html"
                }
            },
            "github":{
                "clientID":"dummyID",
                "clientSecret":"dummySecret",
                "redirect_path":"http://localhost:3000/auth/callback_github",
                "scope":[
                    "notifications"
                ]
            },
            "dropbox":{
                "clientID":"getDropboxId",
                "clientSecret":"getDropboxSecret",
                "redirect_path":"http://localhost:3000/auth/callback_dropbox",
                "scope":[
                    ""
                ]
            },
            "google":{
                "clientID":"getGoogleId",
                "clientSecret":"getGoogleSecret",
                "redirect_path":"http://localhost:3000/auth/callback_google",
                "scope":[
                    "https://www.googleapis.com/auth/drive",
                    "https://www.googleapis.com/auth/userinfo.profile",
                    "https://www.googleapis.com/auth/userinfo.email"
                ]
            },
            "local":{
                "response":{
                    "success":{
                        "url":"/static/idm/authenticateUser.html"
                    }
                },
                "fallback-user-no-pam":{
                    "username":"admin",
                    "password":"correcthorsebatterystaple"
                }
            },
            "web-id":{

            }
        },
        "tls":{
            "key":"./certs/server.key",
            "cert":"./certs/server.crt"
        }
    },
    neros: {
        mqttReconnectTime: 15000,

        // Retry time in milliseconds for Serial port connections
        serialReconnectTime: 15000,

        // The maximum length, in characters, of any message sent to the debug sidebar tab
        debugMaxLength: 1000,

        functionGlobalContext: {
            // os:require('os'),
            // octalbonescript:require('octalbonescript'),
            // jfive:require("johnny-five"),
            // j5board:require("johnny-five").Board({repl:false})
        },

        // Configure the logging output
        logging: {
            // Only console logging is currently supported
            console: {
                // Level of logging to be recorded. Options are:
                // fatal - only those errors which make the application unusable should be recorded
                // error - record errors which are deemed fatal for a particular request + fatal errors
                // warn - record problems which are non fatal + errors + fatal errors
                // info - record information about the general running of the application + warn + error + fatal errors
                // debug - record information which is more verbose than info + info + warn + error + fatal errors
                // trace - record very detailed logging + debug + info + warn + error + fatal errors
                level: "info",
                // Whether or not to include metric events in the log output
                metrics: false,
                // Whether or not to include audit events in the log output
                audit: false
            }
        }
    }
}
