var Hash = require("../hash");

module.exports = function(blogID) {
  if (!blogID) throw "Invalid blogID";

  if (blogID.indexOf("/") > -1) throw "Invalid blogID";

  return Hash("blog:" + blogID).slice(0, 10);
};
