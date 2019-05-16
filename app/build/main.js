var debug = require("debug")("blot:build:main");
var Metadata = require("metadata");
var basename = require("path").basename;
var isDraft = require("../sync/update/drafts").isDraft;
var Build = require("./single");
var Prepare = require("./prepare");
var Thumbnail = require("./thumbnail");
var DateStamp = require("./prepare/dateStamp");
var moment = require("moment");
var converters = require("./converters");
var exitHook = require("async-exit-hook");

// setTimeout(function(){
//   throw new Error('EXCEPTION!');
// }, Math.random() * 20 * 1000);

exitHook(function() {
  debug("Shutting down worker:", process.pid);
});

debug("Worker", process.pid, "started");

// This file cannot become a blog post because it is not
// a type that Blot can process properly.
function isWrongType(path) {
  var isWrong = true;

  converters.forEach(function(converter) {
    if (converter.is(path)) isWrong = false;
  });

  return isWrong;
}

process.on("message", function(message) {
  build(message.blog, message.path, message.options, function(
    err,
    entry
  ) {
    if (err) {
      try {
        err = JSON.stringify(err, Object.getOwnPropertyNames(err));
      } catch (e) {}
    }
    debug(message.id, "Sending back", err, entry);
    process.send({ err: err, entry: entry, id: message.id });
  });
});

function build(blog, path, options, callback) {
  debug("Build:", process.pid, "processing", path);

  if (isWrongType(path)) {
    var err = new Error("Path is wrong type to convert");
    err.code = "WRONGTYPE";
    return callback(err);
  }

  Metadata.get(blog.id, path, function(err, name) {
    if (err) return callback(err);

    if (name) options.name = name;

    debug("Blog:", blog.id, path, " checking if draft");
    isDraft(blog.id, path, function(err, is_draft) {
      if (err) return callback(err);

      debug("Blog:", blog.id, path, " attempting to build html");
      Build(blog, path, options, function(
        err,
        html,
        metadata,
        stat,
        dependencies
      ) {
        if (err) return callback(err);

        debug("Blog:", blog.id, path, " extracting thumbnail");
        Thumbnail(blog, path, metadata, html, function(err, thumbnail) {
          // Could be lots of reasons (404?)
          if (err || !thumbnail) thumbnail = {};

          var entry;

          // Given the properties above
          // that we've extracted from the
          // local file, compute stuff like
          // the teaser, isDraft etc..

          try {
            entry = {
              html: html,
              name: options.name || basename(path),
              path: path,
              id: path,
              thumbnail: thumbnail,
              draft: is_draft,
              metadata: metadata,
              size: stat.size,
              dependencies: dependencies,
              dateStamp: DateStamp(blog, path, metadata),
              updated: moment.utc(stat.mtime).valueOf()
            };

            if (entry.dateStamp === undefined) delete entry.dateStamp;

            debug(
              "Blog:",
              blog.id,
              path,
              " preparing additional properties for",
              entry.name
            );
            entry = Prepare(entry);
            debug("Blog:", blog.id, path, " additional properties computed.");
          } catch (e) {
            return callback(e);
          }

          callback(null, entry);
        });
      });
    });
  });
}

module.exports = build;
