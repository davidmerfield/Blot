var Metadata = require("metadata");
var async = require("async");

module.exports = function breadcrumbs(req, res, next) {
  var dir = req.dir;
  var names = dir.split("/").filter(function(name) {
    return !!name;
  });

  async.eachOfLimit(
    names,
    10,
    function(name, i, done) {
      var path = "/" + names.slice(0, i + 1).join("/");

      Metadata.get(req.blog.id, path, function(err, casePresevedName) {
        if (err) return next(err);

        if (i === 0) {
          res.locals.breadcrumbs.add(
            casePresevedName || name,
            "/folder/" + (casePresevedName || name)
          );
        } else {
          res.locals.breadcrumbs.add(
            casePresevedName || name,
            casePresevedName || name
          );
        }
        done();
      });
    },
    next
  );
};
