var download = require("./download");

module.exports = function(client, folder) {
  return function(change, callback) {
    // Removed file or folder
    if (change[".tag"] === "deleted") {
      folder.remove(change.path, callback);

    // New folder
    } else if (change[".tag"] === "folder") {
      // Change.name preserves case, change.path should be lowercase
      folder.mkdir(change.path, { name: change.name }, callback);

    // New or modified file
    } else if (change[".tag"] === "file") {
      download(client, change.path_lower, function(err, tmp_path) {
        if (err) return callback(err);

        // Change.name preserves case, change.path should be lowercase
        folder.add(tmp_path, change.path, { name: change.name }, callback);
      });
    // Something we are not expecting
    } else {
      callback(
        new Error(
          "No handler for tag" + change[".tag"] + " for file" + change.path
        )
      );
    }
  };
};
