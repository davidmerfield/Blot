var Entries = require("models/entries");

module.exports = function (req, callback) {
  Entries.getPage(req.blog.id, 1, 1, function (entries) {
    entries = entries || [];

    return callback(null, entries[0] || {});
  });
};
