var helper = require("helper");
var fs = require("fs-extra");
var uuid = require("uuid");
var callOnce = helper.callOnce;
var Transform = require("./transform");
var TransformGIF = require("./transform-gif");
var join = require("path").join;
var config = require("config");
var extname = require("path").extname;
var TIMEOUT = 10 * 1000; // 10s
var validate = require("./validate");
var debug = require("debug")("blot:entry:build:thumbnail:create");

function create(blogID, path, done) {
  done = callOnce(done);

  var timeout = setTimeout(function() {
    done(new Error("Timeout"));
  }, TIMEOUT);

  var root = join(config.blog_static_files_dir, blogID);
  var outputDirectory = "/" + join("_thumbnails", uuid());
  var fullPathToOutputDirectory = join(root, outputDirectory);
  var extension = extname(path).toLowerCase();

  validate(path, function(err) {
    if (err) {
      debug(blogID, "Invalid thumbnail candidate", path, err);
      return done(err);
    }

    fs.ensureDir(fullPathToOutputDirectory, function(err) {
      if (err) return done(err);

      var transform = extension === ".gif" ? TransformGIF : Transform;

      transform(path, fullPathToOutputDirectory, function(err, thumbnails) {
        if (err) return done(err);

        for (var i in thumbnails) {
          thumbnails[i].path = outputDirectory + "/" + thumbnails[i].name;
          thumbnails[i].url =
            config.cdn.origin + "/" + blogID + thumbnails[i].path;
        }

        if (err) return done(err);

        clearTimeout(timeout);

        done(null, thumbnails);
      });
    });
  });
}

module.exports = create;
