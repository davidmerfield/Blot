const client = require("models/client");
const key = require("./key");

// store a case preserving name against
// a case-sensitive path to a file on disk
module.exports = function drop(blogID, path, callback) {
  var multi = client.multi();

  multi.DEL(key.path(blogID, path));
  multi.SREM(key.all(blogID), key.path(blogID, path));
  multi.exec(function (err) {
    if (err) console.log(err);

    return callback(err);
  });
};
