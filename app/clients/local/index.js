module.exports = {
  display_name: "Local folder",

  description: "Use a folder on this server",

  remove: function remove(blogID, path, callback) {
    require("fs-extra").remove(
      require("helper").localPath(blogID, path),
      callback
    );
  },

  write: function write(blogID, path, contents, callback) {
    require("fs-extra").outputFile(
      require("helper").localPath(blogID, path),
      contents,
      callback
    );
  },

  disconnect: require('./disconnect'),

  // This is where the user is asked to select a folder
  dashboard_routes: require("./controller"),

  // We expose a special method to make it easier
  // for the test suit to interact with this client
  // Don't do this for normal client.
  setup: require("./sync")
};
