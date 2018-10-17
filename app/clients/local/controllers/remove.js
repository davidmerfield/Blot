module.exports = function remove(blogID, path, callback) {
  require("fs-extra").remove(
    require("helper").localPath(blogID, path),
    callback
  );
};
