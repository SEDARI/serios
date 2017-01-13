var settings = require("../settings.js").storage;

if(settings.type === "mongodb") {
    var client = require("mongodb").MongoClient;

    console.log("Initialize MongoDB Database");
    
    var admin = "admin";
    var pwd = "serios";
    var adminDB = "admin";

    var url = "mongodb://"+settings.host+":"+settings.port;

    var adminDB = null;
    var newDB = null;
    var db = null;
    
    client.connect(url)
        .then(function(_db) {
            db = _db;
            adminDB = db.admin();
            return adminDB.authenticate(admin, pwd);
        })
        .then(function() {
            return db.db(settings.dbname);
        })
        .then(function(_db) {
            newDB = _db;
            return newDB.addUser(settings.user, settings.password, { roles : [ { role : "readWrite", db : settings.dbname } ] } );
        })
        .then(function() {
                return newDB.authenticate(settings.user, settings.password);
            }
        )
        .then(function() {
            console.log("New user is authenticated");
            //return db.createCollection("sensordata")
            return Promise.resolve();
        })
        .then(function() {
                console.log("Sensor data collection successfully created.");
                return newDB.createIndex("sensordata", { lastUpdate : -1 });
            }
        )
        .then(function() {
                db.close();
            }
        )
        .catch(function(err) {
            console.log(err);
            db.close();
        });
}
