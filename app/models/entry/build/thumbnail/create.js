var helper = require('helper');
var tempDir = helper.tempDir();
var UID = helper.makeUid;
var fs = require('fs-extra');
var callOnce = helper.callOnce;
var transform = require('./transform');
var minify = require('./minify');
var validate = require('./validate');
var join = require('path').join;
var config = require('config');

var TIMEOUT = 10 * 1000; // 10s

function create (blogID, path, done){

  done = callOnce(done);

  var timeout = setTimeout(function(){
    done(new Error('Timeout'));
  }, TIMEOUT);

  // validate(path, function(err){

  //   if (err) return done(err);

    var root = join(config.blog_static_files_dir, blogID);
    var outputDirectory = join('_thumbnails', UID(10));
    var fullPathToOutputDirectory = join(root, outputDirectory);

    fs.ensureDir(fullPathToOutputDirectory, function(err){

      if (err) return done(err);

      // console.log('Generating thumbnails...');

      transform(path, fullPathToOutputDirectory, function(err, thumbnails){

        if (err) return done(err);

        for (var i in thumbnails)
          thumbnails[i].path = outputDirectory + '/' + thumbnails[i].name;
        
        // console.log('Minifying thumbnails...');

        minify(fullPathToOutputDirectory, function(err){

          if (err) return done(err);

          clearTimeout(timeout);

          done(null, thumbnails);
        });
      });
    });
  // });
}

module.exports = create;