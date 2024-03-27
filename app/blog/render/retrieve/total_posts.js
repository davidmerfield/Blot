const Entries = require("models/entries");

module.exports = function (req, callback) {
  Entries.getTotal(req.blog.id, callback);
};
