var Entry = require("models/entry");

module.exports = function (req, callback) {
  var blogID = req.blog.id;

  // We couldn't find a search query
  if (!req.query.q) {
    return callback(null, []);
  }

  Entry.search(blogID, req.query.q, function (err, ids) {
    if (err) return callback(err);

    for (var i in ids) ids[i] = parseFloat(ids[i]);

    Entry.get(blogID, ids, function (entries) {
      return callback(null, entries);
    });
  });
};
