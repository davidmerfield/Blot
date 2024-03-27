module.exports = function isMultiFilePost (path) {
  return !!path.split("/").find(i => i.startsWith("(") && i.endsWith(")"));
};
