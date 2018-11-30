var config = require("../../config");
var helper = require("../../app/helper");
var Template = require("../../app/models/template");

var fs = require("fs-extra");
var _ = require("lodash");
var path = require("path");
var mime = require("mime");
var async = require("async");
var watcher = require("watcher");

var extend = helper.extend;
var TEMPLATEDIR = path.resolve(__dirname + "/../../app/templates");
var defaultDir = TEMPLATEDIR + "/_";
var defaultInfo = fs.readJsonSync(TEMPLATEDIR + "/_/package.json");

// Generate list of template names based on the names of
// directories inside app/templates (e.g. ['console', 'default', ...])
var templates = fs.readdirSync(TEMPLATEDIR).filter(function(name) {
  return (
    name[0] !== "." &&
    name !== "_" &&
    name.toLowerCase().indexOf("readme") === -1
  );
});

// If invoked from the command line, build
// every template and then wait for changes
// if inside development mode. I might want
// to export the function for building a
// single template, I might not...
if (require.main === module) {
  async.each(templates, build, function(err) {
    if (err) throw err;

    require("../cache/empty")();
    console.log("Built all templates successfully");

    if (config.environment !== "development") return process.exit();

    console.log("Watching public directory for changes...");
    process.stdin.resume();
    templates.forEach(watch);
  });
}

// Breaking this up allows us to watch individual
// template directories and only rebuilt specific
// templates, rather than every single template.
function watch(name) {
  watcher(TEMPLATEDIR, function() {
    build(name, function(err) {
      if (err) console.error(err);
      require("../cache/empty")();
    });
  });
}

// Name e.g. 'default' or 'console'
function build(name, callback) {
  console.log("Building", name);

  var owner = "SITE";
  var dir = TEMPLATEDIR + name + "/";
  var info, views;

  try {
    info = fs.readJsonSync(dir + "package.json");
  } catch (e) {
    return callback(new Error("Please create a package.json"));
  }

  extend(info).and(defaultInfo);
  info.name = info.name || helper.capitalise(name);

  views = _.cloneDeep(info.views);
  delete info.views;

  Template.update(owner, info.name, info, function(err) {
    if (err) return callback(err);

    var viewpaths = fs
      .readdirSync(dir)
      .map(function(n) {
        return dir + "/" + n;
      })
      .concat(
        fs.readdirSync(defaultDir).map(function(n) {
          return defaultDir + "/" + n;
        })
      );

    async.each(
      viewpaths,
      function(path, next) {
        var viewFilename = require("path").basename(path);

        if (viewFilename.slice(0, 1) === ".") return next();
        if (viewFilename === "package.json") return next();

        var viewName = viewFilename.slice(0, viewFilename.lastIndexOf("."));
        var viewContent;

        try {
          viewContent = fs.readFileSync(dir + viewFilename, "utf-8");
        } catch (err) {
          if (err && err.code === "EISDIR") return next();
          return next(err);
        }

        var view = {
          name: viewName,
          type: mime.lookup(viewFilename),
          content: viewContent
        };

        if (view.name.slice(0, 1) === "_") {
          view.name = view.name.slice(1);
        }

        if (views && views[view.name]) {
          var newView = views[view.name];
          extend(newView).and(view);
          view = newView;
        }

        Template.setView(templateID, view, function onSet(err) {
          if (err) {
            view.content = err;
            Template.setView(templateID, view, function() {});
            console.log("her");
            return callback(err);
          }

          next();
        });
      },
      callback
    );
  });
}
