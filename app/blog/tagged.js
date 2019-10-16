module.exports = function(server) {
  var Entry = require("entry");
  var Tags = require("tags");
  var _ = require("lodash");

  server.get("/tagged/:tag*", function(request, response, next) {
    var blog = request.blog;
    var blogID = blog.id;
    var slug = request.params.tag;

    Tags.get(blogID, slug, function(err, entryIDs, tag) {
      Entry.get(blogID, entryIDs, function(entries) {
        entries = _.sortBy(entries, "dateStamp").reverse();

        response.addLocals({
          tag: tag,
          slug: slug,
          entries: entries,
          total: entries.length
        });

        response.renderView("tagged.html", next);
      });
    });
  });
};
