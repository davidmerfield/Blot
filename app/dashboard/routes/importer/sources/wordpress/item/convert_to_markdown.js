module.exports = function(entry, callback) {
  entry.content = require("../../../helper").to_markdown(entry.html);
  callback(null, entry);
};
