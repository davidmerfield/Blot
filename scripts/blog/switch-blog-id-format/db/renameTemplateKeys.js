module.exports = function renameTransformerIDs(
  keys,
  multi,
  oldBlogID,
  newBlogID,
  callback
) {
  keys = keys.filter(function(key) {
    return key.indexOf("template:" + oldBlogID + ":") === 0;
  });

  keys.forEach(function(key) {
    multi.RENAMENX(
      key,
      key
        .split("template:" + oldBlogID + ":")
        .join("template:" + newBlogID + ":")
    );
  });

  callback();
};
