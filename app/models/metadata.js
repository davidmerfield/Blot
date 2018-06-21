var client = require("client");

var key = {
  all: function(blogID) {
    return "blog:" + blogID + ":folder:everything";
  },

  path: function(blogID, path) {
    return "blog:" + blogID + ":folder:" + path;
  }
};

// store a case preserving name against
// a case-sensitive path to a file on disk
function add(blogID, path, name, callback) {
  var multi = client.multi();

  // store the case-preserved name against
  // the case-sensitive file path so we can
  // look it up later
  // store the key in a set so we can remove all
  // keys if the blog needs to be deleted
  multi.SET(key.path(blogID, path), name);
  multi.SADD(key.all(blogID), key.path(blogID, path));
  multi.exec(function(err) {
    if (err) console.log(err);

    return callback(err);
  });
}

// store a case preserving name against
// a case-sensitive path to a file on disk
function drop(blogID, path, callback) {
  var multi = client.multi();

  multi.DEL(key.path(blogID, path));
  multi.SREM(key.all(blogID), key.path(blogID, path));
  multi.exec(function(err) {
    if (err) console.log(err);

    return callback(err);
  });
}

// retrives the case preserved name for
// a given file stored at a particular path
function get(blogID, input, callback) {
  if (typeof input === "string") {
    client.GET(key.path(blogID, input), callback);
  } else if (Array.isArray(input)) {
    if (input.length) {
      client.MGET(input.map(key.path.bind(this, blogID)), callback);
    } else {
      callback(null, []);
    }
  } else {
    callback(new Error("Pass a string or array"));
  }
}

module.exports = {
  add: add,
  drop: drop,
  get: get
};
