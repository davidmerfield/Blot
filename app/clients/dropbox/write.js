var join = require("path").join;
var Dropbox = require("dropbox");
var database = require("./database");
var debug = require("debug")("clients:dropbox:write");

module.exports = function write(blogID, path, contents, callback) {
  var pathInDropbox, client;

  debug("Writing to", path);

  database.get(blogID, function(err, account) {
    if (err || !account) return callback(err || new Error("No account"));

    pathInDropbox = join(account.folder || "/", path);
    client = new Dropbox({ accessToken: account.access_token });

    client
      .filesUpload({
        contents: contents,
        autorename: false,
        mode: { ".tag": "overwrite" },
        path: pathInDropbox
      })
      .then(function(res) {
        if (!res) return callback(new Error("No response from Dropbox"));
        callback();
      })
      .catch(function(err) {
        callback(err);
      });
  });
};
