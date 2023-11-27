var Entries = require("models/entries");

module.exports = function (req, callback) {
  Entries.getAll(req.blog.id, function (allEntries) {
    return callback(null, allEntries);
  });
};
