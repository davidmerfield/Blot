var ensure = require("helper/ensure");

module.exports = {
  everything: function (blogID) {
    ensure(blogID, "string");
    return "blog:" + blogID + ":404:everything";
  },
  ignore: function (blogID) {
    ensure(blogID, "string");
    return "blog:" + blogID + ":404:ignore";
  },
};
