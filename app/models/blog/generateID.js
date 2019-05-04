var uuid = require("uuid/v4");

module.exports = function() {
  return (
    "blog_" +
    uuid()
      .split("-")
      .join("")
      .toLowerCase()
  );
};
