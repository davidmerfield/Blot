module.exports = function write(blogID, path, contents, callback) {
  require("../models/folder").get(blogID, function(err, folder) {
    if (err) return callback(err);
    require("fs-extra").outputFile(
      require("path").join(folder, path),
      contents,
      callback
    );
  });
};
