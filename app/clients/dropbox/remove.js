var join = require("path").join;
var createClient = require("./util/createClient");
var database = require("./database");
var helper = require("helper");
var ensure = helper.ensure;
var debug = require("debug")("clients:dropbox:remove");

module.exports = function remove(blogID, path, callback) {
  ensure(blogID, "string")
    .and(path, "string")
    .and(callback, "function");

  debug("Removing", path);

  database.get(blogID, function(err, account) {
    var client = createClient(account.access_token);

    client
      .filesDelete({
        path: join(account.folder || "/", path)
      })
      .then(function(res) {
        if (!res) return callback(new Error("No response from Dropbox"));
        callback(null);
      })
      .catch(function(err) {
        // The file does not exist
        if (err.status === 409) return callback();

        callback(err);
      });
  });
};
