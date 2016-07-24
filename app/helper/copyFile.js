var fs = require('fs');
var mkdirp = require('./mkdirp');
var dirname = require('path').dirname;

module.exports = function copyFile(source, target, cb) {

  mkdirp(dirname(target), function(err){

    if (err) return cb(err);

    var cbCalled = false;

    function done(err) {
      if (!cbCalled) {
        cb(err);
        cbCalled = true;
      }
    }

    var rd = fs.createReadStream(source);

    rd.on('error', function(err) {
      done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on('error', function(err) {
      done(err);
    });
    wr.on('close', function() {
      done();
    });
    rd.pipe(wr);
  });
};