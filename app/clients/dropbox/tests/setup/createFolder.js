var uuid = require("uuid/v4");
var retry = require("../../util/retry");
module.exports = function(options) {
  return function createFolder(callback) {
    var client = this.client;
    var context = this;

    if (options.root) {
      context.folder = "";
      context.folderID = "";
      return callback();
    }

    var create = retry(Create);

    create(client, function(err, folder, folderID) {
      if (err) return callback(err);

      context.folder = folder;
      context.folderID = folderID;

      callback(null);
    });
  };
};

function Create(client, callback) {
  var path = "/" + uuid();
  client
    .filesCreateFolder({ path: path })
    .then(function(res) {
      callback(null, res.path_lower, res.id);
    })
    .catch(function(err) {
      callback(new Error("Could not set up test folder"));
    });
}
