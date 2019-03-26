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

// Template files (e.g. entry.html) cannot be > 2.5mb
var MAX_SIZE = 2.5 * 1000 * 1000;

// Transforms a directory of template files into a Blot template
// Should this be called build?
function read(blogID, folder, callback) {
  debug(blogID, folder);

  // Template metadata is stored in package.json in the root folder
  readMetadata(blogID, folder, function(err, metadata, viewMetadata) {
    if (err) return callback(err);

    // Create or update a template with the data in package.json
    saveMetadata(blogID, folder, metadata, function(err, template) {
      if (err) return callback(err);

      fs.readdir(folder, function(err, contents) {
        if (err) return callback(err);

        debug(blogID, folder, "read contents", contents);

        // Walk the template directory and for each file which
        // can be turned into a template view (e.g. entry.html)
        // read it and add it to the template.
        async.filter(contents, validViewFiles(folder), function(err, views) {
          debug(blogID, folder, "views in package:", viewMetadata);

          // Merge any view properties declared in
          // package.json. This is typically where
          // you will specify the route for a view.
          views = views.map(function(viewID) {
            var view = {
              name: nameFrom(viewID),
              id: viewID,
              type: mime.lookup(viewID)
            };

            if (viewMetadata[view.name] !== undefined) {
              debug("Merging properties from package", view);
              Object.assign(view, viewMetadata[view.name]);
            }

            return view;
          });

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

function readMetadata(blogID, folder, callback) {
  var views = {};

  fs.readJson(folder + "/package.json", function(err, metadata) {
    if (err && err.code !== "ENOENT") return callback(err);

    // If the template folder lacks a package.json file
    metadata = metadata || {};

    // Views are not part of the template model, but they
    // are in the package.json file. Extract them before ensure
    if (metadata.views) {
      views = JSON.parse(JSON.stringify(metadata.views));
    }

    // Remove all properties which do not match this spec
    ensure(metadata, {
      name: "string",
      slug: "string",
      description: "string",
      thumb: "string",
      locals: "object"
    });

    debug(blogID, folder, "parsed metadata", metadata);

    callback(null, metadata, views);
  });
}

function saveMetadata(blogID, folder, metadata, callback) {
  var templateID = makeID(blogID, basename(folder));

  get(templateID, function(err, template) {
    if (err) return callback(err);

    if (template) {
      template = Object.assign(template, metadata);
      debug(blogID, folder, "updating template", template);
      update(templateID, template, callback);
    } else {
      debug(blogID, folder, "creating template", template);
      create(blogID, basename(folder), metadata, callback);
    }
  });
}

function saveView(templateID, folder) {
  return function(view, next) {
    fs.readFile(folder + "/" + view.id, "utf-8", function(err, content) {
      if (err) return next();
      debug(templateID, folder, "saving view", view);
      view.content = content;
      view.url = view.url || view.id;

      // This is the filename for the view
      delete view.id;

      set(templateID, view, next);
    });
  };
}

// Eventually we should add a check by mimetype against
// a whitelist to avoid locking the server up
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

module.exports = read;
