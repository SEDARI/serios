// the real stuff goes in here, e.g. how to create
// an SO with the complete interaction with the DB etc.
var sos = require("../sos");

module.exports = {
    post : function(req, res) {
        // do something
        sos.create();
        
        res.status(501).json({ msg : "Sorry. Not implemented yet"});
    }
}
