var Metadata = require("metadata");
var async = require("async");

module.exports = function breadcrumbs(req, res, next) {
  
  var breadcrumbs = [];
  var dir = req.dir;
  var redirect = req.header("Referer") || "/";
  var names = dir.split("/").filter(function(name) {
    return !!name;
  });

  breadcrumbs.push({ label: "Folder", first: true, url: "/view?path=/" });

  async.eachOfLimit(
    names,
    10,
    function(name, i, done) {
      var path = '/' + names.slice(0, i + 1).join("/");

      Metadata.get(req.blog.id, path, function(err, casePresevedName) {
        
        if (err) return next(err);

      
        breadcrumbs.push({
          url: "/view?redirect=" + redirect + "&path=" + path,
          label: casePresevedName || name,
          path: path
        });

        done();
      });
    },
    function() {
      breadcrumbs[breadcrumbs.length - 1].last = true;

      res.locals.folder.breadcrumbs = breadcrumbs;

      return next();
    }
  );
};
