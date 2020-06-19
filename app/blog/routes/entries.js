module.exports = function(server) {
  var Entries = require("entries");

  server.get("/page/:page_number", renderPage);
  server.get("/", renderPage);

  function renderPage(req, res, next) {
    var blog = req.blog;

    var pageNo, pageSize;

    try {
      pageNo = parseInt(req.params.page_number) || 1;
    } catch (e) {
      pageNo = 1;
    }

    try {
      // when I remove the blog.pageSize option,
      // consider users whove customized the page size
      // but use a default template...
      pageSize = req.template.locals.page_size || req.blog.pageSize;
      pageSize = parseInt(pageSize) || 5;
    } catch (e) {
      pageSize = 5;
    }

    Entries.getPage(blog.id, pageNo, pageSize, function(entries, pagination) {
      var pageTitle = blog.title;

      if (pageNo > 1) {
        pageTitle = "Page " + pageNo + " of " + pageTitle;
      }

      pagination.current = pageNo;

      res.addLocals({
        pageTitle: pageTitle,
        entries: entries,
        pagination: pagination
      });

      res.renderView("entries.html", next);
    });
  }
};
