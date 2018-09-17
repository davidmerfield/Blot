var helper = require('helper');
var tempDir = helper.tempDir();
var UID = helper.makeUid;
var mkdirp = helper.mkdirp;
var rm = helper.remove;
var callOnce = helper.callOnce;
var transform = require('./transform');
var minify = require('./minify');
var upload = require('./upload');
var validate = require('./validate');

var TIMEOUT = 10 * 1000; // 10s

function create (blogID) {

  return function (path, done){

    var output = tempDir + UID(10);

    done = callOnce(done);

    var timeout = setTimeout(function(){
      done(new Error('Timeout'));
    }, TIMEOUT);

    validate(path, function(err){

      if (err) return done(err);

      mkdirp(output, function(err){

        if (err) return done(err);

        // console.log('Generating thumbnails...');

        transform(path, output, function(err, thumbnails){

          if (err) return done(err);

          // console.log('Minifying thumbnails...');

          minify(output, function(err){

            if (err) return done(err);

            // console.log('Uploading thumbnails...');

            upload(blogID, thumbnails, function(err, thumbnails){

              rm(output);

              // console.log('Thumbnails ready!');

              clearTimeout(timeout);

              done(null, thumbnails);
            });
          });
        });
      });
    });
  };
}

module.exports = create;