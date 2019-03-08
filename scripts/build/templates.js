var watcher = require("watcher");
var emptyCache = require("../cache/empty");
var Template = require("../../app/models/template");
var async = require("async");
var fs = require("fs-extra");
var colors = require("colors/safe");

all("SITE", __dirname + "/../../app/templates/past", function(err, templates) {
  async.each(
    templates,
    function(template, next) {
      console.log(colors.dim(".."), template.id);
      Template.update(template.id, { isPublic: false }, next);
    },
    function(err) {
      if (err) throw err;
      watch(__dirname + "/../../app/templates/past");
    }
  );
});

all("SITE", __dirname + "/../../app/templates/latest", function(
  err,
  templates
) {
  async.each(
    templates,
    function(template, next) {
      console.log(colors.dim(".."), template.id);
      Template.update(template.id, { isPublic: true }, next);
    },
    function(err) {
      if (err) throw err;
      watch(__dirname + "/../../app/templates/latest");
    }
  );
});

function watch(directory) {
  // Stop the process from exiting automatically
  process.stdin.resume();
  console.log("Watching", directory, "for changes...");

  var queue = async.queue(function(directory, callback) {
    Template.read("SITE", directory, function(err) {
      if (err) {
        console.error(err.message);
        callback();
      } else {
        emptyCache(callback);
      }
    });
  });

  watcher(directory, function(path) {
    var subdirectoryName = path.slice(directory.length).split("/")[1];

    queue.push(directory + "/" + subdirectoryName);
  });
}

// Reads a directory containing template directories
// this is used to build Blot's templates (owner === 'SITE')
// and also to build templates the user is editing locally
// inside /Templates
function all(owner, dir, callback) {
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
            Template.read(owner, dir + "/" + item, next);
          },
          callback
        );
      }
    );
  });
}
