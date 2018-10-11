var helper = require("helper");
var fs = require("fs-extra");
var uuid = require('uuid');
var callOnce = helper.callOnce;
var transform = require("./transform");
var join = require("path").join;
var config = require("config");

var TIMEOUT = 10 * 1000; // 10s

var minify = require("./minify");
var validate = require("./validate");

function create(blogID, path, done) {
  done = callOnce(done);

  var timeout = setTimeout(function() {
    done(new Error("Timeout"));
  }, TIMEOUT);

  var root = join(config.blog_static_files_dir, blogID);
  var outputDirectory = "/" + join("_thumbnails", uuid());
  var fullPathToOutputDirectory = join(root, outputDirectory);

  fs.ensureDir(fullPathToOutputDirectory, function(err) {
    if (err) return done(err);

    transform(path, fullPathToOutputDirectory, function(err, thumbnails) {
      if (err) return done(err);

      for (var i in thumbnails) {
        thumbnails[i].path = outputDirectory + "/" + thumbnails[i].name;
        thumbnails[i].url = thumbnails[i].path;
      }

      if (err) return done(err);

      clearTimeout(timeout);

      done(null, thumbnails);
    });
  });
}

module.exports = create;
