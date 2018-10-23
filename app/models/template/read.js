var debug = require("debug")("blot:template:read");
var basename = require("path").basename;
var fs = require("fs-extra");
var async = require("async");
var mime = require("mime");
var async = require("async");
var mime = require("mime");
var helper = require("helper");
var ensure = helper.ensure;

var set = require("./view").set;
var makeID = require("./util/makeID");
var create = require("./create");
var get = require("./get");
var update = require("./update");

var MAX_SIZE = 2.5 * 1000 * 1000; // 2.5mb

function read(blogID, folder, callback) {
  // Create a new template if it doesn't exist, otherwise
  // update an existing template with the contents of package.json
  debug(blogID, folder);
  parsePackageJson(blogID, folder, function(err, metadata, viewsInPackage) {
    if (err) return callback(err);

    debug(blogID, folder, "parsed metadata", metadata);

    saveTemplate(blogID, folder, metadata, function(err, template) {
      if (err) return callback(err);

      debug(blogID, folder, "saved template", template);
      fs.readdir(folder, function(err, contents) {
        if (err) return callback(err);

        debug(blogID, folder, "read contents", contents);
        // We remove system files and large files
        async.filter(contents, validViewFiles(folder), function(err, views) {
          // Merge any view properties declared in
          // package.json. This is typically where
          // you will specify the route for a view.
          for (var viewID in views)
            if (viewsInPackage[viewID] !== undefined)
              Object.assign(views[viewID], viewsInPackage[viewID]);

          debug(blogID, folder, "saving views", views);

          // We read the contents of each file as save it
          async.each(views, saveView(template.id, folder), function(err) {
            callback(err, template);
          });
        });
      });
    });
  });
}

function parsePackageJson(blogID, folder, callback) {
  var views = {};

  fs.readJson(folder + "/package.json", function(err, metadata) {
    if (err && err.code !== "ENOENT") return callback(err);

    // If the template folder lacks a package.json file
    metadata = metadata || {};

    // Views are not part of the template model, but they
    // are in the package.json file. Extract them before ensure
    if (metadata.views) views = JSON.parse(JSON.stringify(metadata.views));

    // Remove all properties which do not match this spec
    ensure(metadata, {
      name: "string",
      slug: "string",
      description: "string",
      thumb: "string",
      locals: "object"
    });

    callback(null, metadata, views);
  });
}

function saveTemplate(blogID, folder, metadata, callback) {
  var templateID = makeID(blogID, basename(folder));

  get(templateID, function(err, template) {
    if (err) return callback(err);

    if (template) {
      template = Object.assign(template, metadata);
      update(templateID, template, callback);
    } else {
      create(blogID, basename(folder), metadata, callback);
    }
  });
}

function saveView(templateID, folder) {
  return function(viewID, next) {
    fs.readFile(folder + "/" + viewID, "utf-8", function(err, content) {
      if (err) return next();
      debug(templateID, folder, "saving view", viewID);
      set(
        templateID,
        {
          name: nameFrom(viewID),
          type: mime.lookup(viewID),
          content: content
        },
        next
      );
    });
  };
}
function validViewFiles(dir) {
  return function(item, next) {
    // Dotfile
    if (item[0] === ".") return next(null, false);

    // Package.json
    if (item === "package.json") return next(null, false);

    fs.stat(dir + "/" + item, function(err, stat) {
      if (err) return next(null, false);

      next(null, stat.size < MAX_SIZE);
    });
  };
}

function nameFrom(str) {
  var name = str;

  if (name.indexOf(".") > -1) name = name.slice(0, name.lastIndexOf("."));

  if (name[0] === "_") name = name.slice(1);

  return name;
}

// Reads a directory containing template directories
// this is used to build Blot's templates (owner === 'SITE')
// and also to build templates the user is editing locally
// inside /Templates
function all(owner, dir, callback) {
  debug(owner, dir, "reading all");
  fs.readdir(dir, function(err, contents) {
    if (err) return callback(err);

    async.filter(
      contents,
      function(item, next) {
        fs.stat(dir + "/" + item, function(err, stat) {
          if (err) return next();
          next(null, stat.isDirectory());
        });
      },
      function(err, contents) {
        if (err) return callback(err);
        async.map(
          contents,
          function(item, next) {
            debug(owner, dir + "/" + item, "building template");
            read(owner, dir + "/" + item, next);
          },
          callback
        );
      }
    );
  });
}

read.all = all;
module.exports = read;
