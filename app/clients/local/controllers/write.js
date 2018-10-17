module.exports = function write(blogID, path, contents, callback) {
  require("fs-extra").outputFile(
    require("helper").localPath(blogID, path),
    contents,
    callback
  );
};
