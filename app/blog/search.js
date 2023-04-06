module.exports = function (server) {
  var Entry = require("models/entry");

  server.get("/search", function (request, response, next) {
    if (request.query.q) {
      Entry.search(request.blog.id, request.query.q, then);
    } else {
      then(null, []);
    }

    function then(err, entries) {
      response.addLocals({
        query: request.query.q,
        entries: entries || [],
      });

      // Don't cache search results until we
      response.set("Cache-Control", "no-cache");
      response.renderView("search.html", next);
    }
  });
};
