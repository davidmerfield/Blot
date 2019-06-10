var fs = require("fs-extra");
var basename = require("path").basename;
var async = require("async");
var makeID = require("./util/makeID");
var setView = require("./setView");
var setMetadata = require("./setMetadata");
var getMetadata = require("./getMetadata");
var create = require("./create");
var MAX_SIZE = 2.5 * 1000 * 1000; // 2.5mb
var PACKAGE = "package.json";
var METADATA_PROPERTY_WHITELIST = ["name", "description", "locals"];
var metadataModel = require("./metadataModel");
var type = require("helper").type;

function establishTemplate(blogID, dir, callback) {
  var templateID = makeID(blogID, basename(dir));
  getMetadata(templateID, function(err, metadata) {
    if (err) return callback(err);

    if (metadata) return callback(null, templateID);

    create(blogID, basename(dir), { name: basename(dir) }, function(err) {
      if (err) return callback(err);
      callback(null, templateID);
    });
  });
}

function saveMetadata(templateID, dir, callback) {
  var metadata = {};

  fs.readJson(dir + "/package.json", function(err, json) {
    if (err) return callback();

    if (!json) return callback();

    METADATA_PROPERTY_WHITELIST.forEach(function(property) {
      if (json[property] && type(json[property]) === metadataModel[property])
        metadata[property] = json[property];
    });

    setMetadata(templateID, metadata, function(err) {
      callback();
    });
  });
}

module.exports = function readFromFolder(blogID, dir, callback) {
  establishTemplate(blogID, dir, function(err, templateID) {
    if (err) return callback(err);
    saveMetadata(templateID, dir, function(err, metadata) {
      if (err) return callback(err);
      loadViews(templateID, dir, function(err) {
        if (err) return callback(err);
        getMetadata(templateID, callback);
      });
    });
  });
};

function loadViews(templateID, dir, callback) {
  fs.readdir(dir, function(err, contents) {
    if (err) return callback(err);

    async.eachSeries(
      contents,
      function(name, next) {
        // Skip Dotfile or Package.json
        if (name[0] === "." || name === PACKAGE) return next();

        fs.stat(dir + "/" + name, function(err, stat) {
          // Skip folders, or files which are too large
          if (err || !stat || stat.size > MAX_SIZE || stat.isDirectory())
            return next();

          fs.readFile(dir + "/" + name, "utf-8", function(err, content) {
            if (err) return next();

            var view = {
              name: name,
              content: content
            };

            setView(templateID, view, function(err) {
              if (err) return next();

              next();
            });
          });
        });
      },
      callback
    );
  });
}

