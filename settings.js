module.exports = {
    server : {
        tls : false,
        host : "127.0.0.1",
        port : 3000
    },
    storage: {
        type: "mongodb",
        location: "mongodb://localhost/serios-database",
        max_number_of_sensor_data_saved : 10000,
        max_duration_of_sensor_data_saved: {
            value: 30,
            // one of 'seconds', 'minutes', 'hours', 'days'.
            timeunit: "days"
        }
    },idm : {
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
    }
};
