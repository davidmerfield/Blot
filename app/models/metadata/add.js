const client = require("models/client");
const key = require("./key");

// store a case preserving name against
// a case-sensitive path to a file on disk
module.exports = function add(blogID, path, name, callback) {
  var multi = client.multi();

  // store the case-preserved name against
  // the case-sensitive file path so we can
  // look it up later
  // store the key in a set so we can remove all
  // keys if the blog needs to be deleted
  multi.SET(key.path(blogID, path), name);
  multi.SADD(key.all(blogID), key.path(blogID, path));
  multi.exec(function (err) {
    if (err) console.log(err);

    return callback(err);
  });
};
