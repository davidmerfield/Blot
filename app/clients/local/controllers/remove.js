module.exports = function remove(blogID, path, callback) {
  require("../models/folder").get(blogID, function(err, folder) {
    if (err) return callback(err);
    require("fs-extra").remove(require("path").join(folder, path), callback);
  });
};
