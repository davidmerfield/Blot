var Metadata = require("metadata");
var helper = require("helper");
var normalize = helper.pathNormalizer;
var fs = require("fs-extra");
var blog_folder_dir = require("config").blog_folder_dir;
var join = require("path").join;
var basename = require("path").basename;
// Serve public files
module.exports = function(server) {
  server.get("/public*", function(req, res, next) {
    var blogID = req.blog.id;

    if (!req.url || !blogID) return next();

    var path = decodeURIComponent(req.url);

    fs.readdir(join(blog_folder_dir, blogID, path), function(err, contents) {
      if (err) return next();

      contents = contents.map(function(name) {
        return join(path, name);
      });

      Metadata.get(blogID, contents, function(err, names) {
        if (err) return next();

        contents = contents.map(function(path, i) {
          return {
            name: names[i] || basename(path),
            path: path
          };
        });

        // This public URL maps to a dir
        // so render the public view
        var crumbs = breadcrumbs(path);

        res.addLocals({
          path: path,
          dirname: basename(path),
          breadcrumbs: crumbs,
          contents: contents
        });

        return res.renderView("public.html", next);
      });
    });
  });
};

function breadcrumbs(dir) {
  if (dir === "/") return [];

  var crumbs = [];

  var names = dir.split("/").filter(function(name) {
    return !!name;
  });

  names.forEach(function(name, i) {
    crumbs.push({
      path: "/" + names.slice(0, i + 1).join("/"),
      name: name
    });
  });

  crumbs.pop();

  if (crumbs.length) crumbs[crumbs.length - 1].last = true;

  return crumbs;
}
