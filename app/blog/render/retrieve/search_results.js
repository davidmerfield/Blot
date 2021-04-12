var Entry = require("entry");
var reds = require("reds");
var transliterate = require("transliteration");

module.exports = function (req, callback) {
  var blogID = req.blog.id;

  // We couldn't find a search query
  if (!req.query.q) {
    return callback(null, []);
  }

  var q = transliterate(req.query.q);
  var search = reds.createSearch("blog:" + blogID + ":search");

  search.query(q).end(function (err, ids) {
    if (err) return callback(err);

    for (var i in ids) ids[i] = parseFloat(ids[i]);

    Entry.get(blogID, ids, function (entries) {
      return callback(null, entries);
    });
  });
};
