var helper = require("helper");
var localPath = helper.localPath;
var fs = require("fs-extra");
var Blog = require("blog");
var model = require("./model");

module.exports = {
  display_name: "Local folder",

  description: "Use a folder on this server",

  remove: function remove(blogID, path, callback) {
    fs.remove(localPath(blogID, path), callback);
  },

  write: function write(blogID, path, contents, callback) {
    fs.outputFile(localPath(blogID, path), contents, callback);
  },

  disconnect: function disconnect(blogID, callback) {
    model.unset(blogID, function(err) {
      if (err) return callback(err);
      // eventually clients should not need to do this
      Blog.set(blogID, { client: "" }, callback);
    });
  },

  // There are no need for any public routes
  // site_routes: require("./routes").site

  // This is where the user is asked to select a folder
  dashboard_routes: require("./controller"),

  // we expose a special method to make it easier
  // for the test suit to interact with this client
  // normal client do not have this method.
  setup: require('./sync')

};
