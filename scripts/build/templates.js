var config = require("../../config");
var Template = require("../../app/models/template");
var emptyCache = require("../cache/empty");
var helper = require("../../app/helper");
var extend = helper.extend;
var basename = require("path").basename;

var fs = require("fs-extra");
var mime = require("mime");
var async = require("async");
var watcher = require("watcher");

var TEMPLATES_DIRECTORY = require("path").resolve(
  __dirname + "/../../app/templates"
);
var TEMPLATES_OWNER = "SITE";

// Right now, there are global template views inside the '_'
// directory. This is bad. I should unfurl this into each
// template directory and use my damn text editor properly.
var GLOBAL_TEMPLATE_DIRECTORY = TEMPLATES_DIRECTORY + "/_";

// Build every template and then
if (require.main === module) {
  main(TEMPLATES_DIRECTORY, function(err) {
    if (err) throw err;

    removeExtinctTemplates(TEMPLATES_DIRECTORY, function(err) {
      if (err) throw err;

      // Wait for changes if inside development mode.
      if (config.environment === "development") {
        watch(TEMPLATES_DIRECTORY);
      } else {
        process.exit();
      }
    });
  });
}

// Builds any templates inside the directory
function main(directory, callback) {
  var directories;

  // Generate list of template names based on the names of
  // directories inside $directory (e.g. ['console', ...])
  directories = fs
    .readdirSync(directory)
    .filter(function(name) {
      return (
        name[0] !== "." &&
        name !== "_" &&
        name.toLowerCase().indexOf("readme") === -1
      );
    })
    .map(function(name) {
      return directory + "/" + name;
    });

  async.each(directories, build, function(err) {
    if (err) return callback(err);

    emptyCache(function() {
      console.log("Built all templates successfully");
      callback();
    });
  });
}

// Path to a directory containing template files
function build(directory, callback) {
  console.log("..", require('path').basename(directory), directory);

  var templatePackage, globalPackage, isPublic, method;
  var name, template, locals, description, views, id;

  try {
    templatePackage = fs.readJsonSync(directory + "/package.json");
    globalPackage = fs.readJsonSync(
      GLOBAL_TEMPLATE_DIRECTORY + "/package.json"
    );
  } catch (e) {
    return callback(e);
  }

  id = TEMPLATES_OWNER + ":" + basename(directory);
  name = templatePackage.name || helper.capitalise(basename(directory));
  description = templatePackage.description || "";
  isPublic = templatePackage.isPublic !== false;

  locals = {};

  extend(locals)
    .and(templatePackage.locals || {})
    .and(globalPackage.locals || {});

  views = {};

  extend(views)
    .and(templatePackage.views || {})
    .and(globalPackage.views || {});

  template = {
    isPublic: isPublic,
    description: description,
    locals: locals
  };

  Template.getMetadata(id, function(err, existingTemplate) {
    // Determine if we need to create a new template or
    // update an existing one.
    method = !!existingTemplate ? Template.update : Template.create;

    method(TEMPLATES_OWNER, name, template, function(err) {
      if (err) return callback(err);

      buildViews(directory, id, views, callback);
    });
  });
}

function buildViews(directory, id, views, callback) {
  var viewpaths;

  viewpaths = fs.readdirSync(directory).map(function(n) {
    return directory + "/" + n;
  });

  viewpaths = viewpaths.concat(
    fs.readdirSync(GLOBAL_TEMPLATE_DIRECTORY).map(function(n) {
      return GLOBAL_TEMPLATE_DIRECTORY + "/" + n;
    })
  );

  async.each(
    viewpaths,
    function(path, next) {
      var viewFilename = basename(path);

      if (viewFilename === "package.json" || viewFilename.slice(0, 1) === ".")
        return next();

      var viewName = viewFilename.slice(0, viewFilename.lastIndexOf("."));
      var viewContent;
      if (viewName.slice(0, 1) === "_") {
        viewName = viewName.slice(1);
      }

      try {
        viewContent = fs.readFileSync(directory + "/" + viewFilename, "utf-8");
      } catch (err) {
        return next();
      }

      var view = {
        name: viewName,
        type: mime.lookup(viewFilename),
        content: viewContent
      };

      if (views && views[view.name]) {
        var newView = views[view.name];
        extend(newView).and(view);
        view = newView;
      }

      Template.setView(id, view, function onSet(err) {
        if (err) {
          view.content = err;
          Template.setView(id, view, function() {});
          return next(err);
        }

        next();
      });
    },
    callback
  );
}

function removeExtinctTemplates(directory, callback) {
  var names = fs.readdirSync(directory).map(function(name) {
    return name.toLowerCase();
  });

  console.log("Checking for extinct templates...");

  Template.getTemplateList("", function(err, templates) {
    if (err) return callback(err);

    templates = templates.filter(function(template) {
      return template.owner === TEMPLATES_OWNER;
    });

    templates = templates.filter(function(template) {
      return names.indexOf(template.name.toLowerCase()) === -1;
    });

    if (templates.length) {
      console.log(
        templates.length +
          " templates no longer exist. Please run these scripts to safely remove them from the database:"
      );
    }

    templates.forEach(function(template) {
      console.log(
        "node scripts/template/archive.js",
        template.name.toLowerCase()
      );
    });

    callback();
  });
}

function watch(directory) {
  // Stop the process from exiting automatically
  process.stdin.resume();
  console.log("Watching", directory, "for changes...");

  var queue = async.queue(function(directory, callback) {
    build(directory, function(err) {
      if (err) {
        console.error(err);
        callback();
      } else {
        emptyCache(callback);
      }
    });
  });

  watcher(directory, function(path) {
    directory =
      TEMPLATES_DIRECTORY +
      "/" +
      path.slice(TEMPLATES_DIRECTORY.length).split("/")[1];

    queue.push(directory);
  });
}
