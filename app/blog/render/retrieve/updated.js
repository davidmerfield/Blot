var Entries = require("models/entries");

module.exports = function (req, callback) {
  Entries.lastUpdate(req.blog.id, function (err, dateStamp) {
    return callback(null, new Date(dateStamp).toUTCString());
  });
};
