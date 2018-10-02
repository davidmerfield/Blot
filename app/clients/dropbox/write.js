var join = require("path").join;
var Dropbox = require("dropbox");
var database = require("./database");
var debug = require("debug")("clients:dropbox:write");

module.exports = function write(blogID, path, contents, callback) {
 
   debug('Writing to', path);

  database.get(blogID, function(err, account) {
    if (err) return callback(err);

    if (!account) return callback(new Error("No account"));

    var client = new Dropbox({ accessToken: account.access_token });

    client
      .filesUpload({
        contents: contents,
        autorename: false,
        mode: { ".tag": "overwrite" },
        path: join(account.folder || "/", path)
      })
      .then(function(res) {
        if (!res) return callback(new Error("No response from Dropbox"));
        callback();
      })
      .catch(function(err) {
        callback(err);
      });
  });
}