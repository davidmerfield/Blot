var fourOhFour = require("../../../../models/404");
var List = fourOhFour.list;

module.exports = function(req, res, next) {
  List(req.blog.id, function(err, list, ignored) {
    if (err) return next(err);

    var has_ignored;

    if (req.query.raw) {
      for (var i in list) list[i] = list[i].url;

      res.setHeader("Content-type", "text/plain");
      res.charset = "UTF-8";
      return res.send(list.join("\n"));
    }

    if (ignored.length) {
      has_ignored = true;
    }

    if (!req.query.ignored) {
      ignored = [];
    }

    res.locals.list = list;
    res.locals.has_ignored = has_ignored;
    res.locals.ignored = ignored;

    next();
  });
};
