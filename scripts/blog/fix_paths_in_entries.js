var get = require("./get");
var Entries = require("../../app/models/entries");
var Entry = require("../../app/models/entry");
var localPath = require("../../app/helper").localPath;
var fs = require("fs");
var dirname = require("path").dirname;
var basename = require("path").basename;
var async = require('async');

if (require.main === module) {
  get(process.argv[2], function(user, blog) {
    main(blog, function(err) {
      if (err) throw err;
      process.exit();
    });
  });
}

// The purpose of this script was to resolve an issue with entries having
// path properties that were not equal to the location of the file on disk
// if the file system is case sensitive.
function main(blog, callback) {
  console.log("Blog " + blog.id + ":", "Fixing bad case in entries...");

  var exists = [];
  var missing = [];
  var existsWithDifferentCase = [];

  Entries.each(
    blog.id,
    function(_entry, next) {
      if (_entry.deleted) return next();

      fs.readdir(dirname(localPath(blog.id, _entry.path)), function(
        err,
        contents
      ) {

        if (err) {
          console.log(err);
          return next();
        }

        if (
          contents.indexOf(basename(_entry.path)) === -1 &&
          contents.indexOf(basename(_entry.path.toLowerCase())) !== -1
        ) {
          existsWithDifferentCase.push(_entry);
        } else if (contents.indexOf(basename(_entry.path)) === -1) {
          missing.push(_entry);
        } else {
          exists.push(_entry);
        }

        next();
      });
    },
    function(err) {
      if (err) return callback(err);
      console.log(exists.length, " files exist on disk with same case");
      console.log(missing.length, " files are missing from the disk", missing);
      console.log(existsWithDifferentCase.length, "files exists on disk with a different case..");
      async.eachSeries(existsWithDifferentCase, function(entryWithIncorrectCaseForPath, next){
        var currentPath = entryWithIncorrectCaseForPath.path;
        var candidates = fs.readdirSync(dirname(localPath(blog.id, currentPath))).filter(function(name){
          return name.toLowerCase() === basename(currentPath).toLowerCase();
        });

        if (candidates.length > 1) {
          console.log('!', currentPath, candidates);
          next();
        } else if (candidates.length === 1) {


          console.log('calling entry set!', currentPath, currentPath.toLowerCase());

          Entry.set(blog.id, currentPath, {path: currentPath.toLowerCase()}, next);

          // console.log('O', basename(currentPath), '------>', candidates[0]);
        } else {
          console.log('X', currentPath, 'has no candidates for rename');
          next();          
        }
        
      }, function(err){
        console.log("Blog " + blog.id + ":", "Fixed all entries!");
        callback();      
      });
    }
  );
}

module.exports = main;
