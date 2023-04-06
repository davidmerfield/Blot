module.exports = function (server) {
  var Entry = require("models/entry");

  server.get("/search", function (request, response, next) {
    if (request.query.q) {
      Entry.search(request.blog.id, request.query.q, function (err, ids) {
        if (err) return next(err);

        for (var i in ids) ids[i] = ids[i];

        Entry.get(request.blog.id, ids, then);
      });
    } else {
      then([]);
    }

    function then(entries) {
      response.addLocals({
        query: request.query.q,
        entries: entries,
      });

      // Don't cache search results until we
      response.set("Cache-Control", "no-cache");
      response.renderView("search.html", next);
    }
  });
};
