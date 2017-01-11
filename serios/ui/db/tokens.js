var tokens = {};
//id is a string...
exports.find = function (id, done) {
    console.log("FIND TOKEN: "+id);
    if (tokens[id]) {
        console.log("FOUND");
    return done(null, tokens[id]);
  } else {
    return done(null, null);
  }
};

exports.create = function (id, token, done) {
    console.log("CREATE TOKEN: "+id);
    tokens[id] = token;
    return done(null, tokens[id]);
};

exports.delete = function (id, done) {
    console.log("DELETE TOKEN: "+id);
  delete tokens[id];
  done();
}
