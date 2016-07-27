var helper = require('helper');
var fs = require('fs');
var joinpath = require('path').join;
var forEach = helper.forEach;
var file = require('./file');
var SYSTEM_FILES = ['.DS_Store', '.git'];
var log = require('single-line-log').stdout;

module.exports = function directory (source, output, callback) {

  fs.readdir(source, function(err, contents){

    if (err) throw err;

    if (!contents || !contents.length) {
      log(); // clear log line
      console.log('⚠  Warning: Empty source directory', source);
      return callback();
    }

    forEach.multi(10)(contents, function(name, next){

      if (SYSTEM_FILES.indexOf(name) > -1)
        return next();

      var source_path = joinpath(source, name);
      var output_path = joinpath(output, name);

      fs.stat(source_path, function (err, stat){

        if (err || !stat)
          throw err || new Error('No stat ' + source_path);

        if (stat.isDirectory())
          return directory(source_path, output_path, next);


        file(source_path, output_path, next);
      });
    }, function(){
      log(); // clear log line
      callback();
    });
  });
};