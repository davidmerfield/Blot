var helper = require("../helper");
var ensure = helper.ensure;
var forEach = helper.forEach;
var normalize = helper.pathNormalizer;
var LocalPath = helper.localPath;

var Emit = require("./emit");

var fs = require("fs");
var Entry = require("../models/entry");
var Ignored = require("../models/ignoredFiles");
var joinPath = require("path").join;
var makeStat = require("./makeStat");

module.exports = function(blogID) {
  ensure(blogID, "string");

  var emit = new Emit(blogID);
  var changes = [];

  return function check(dir, callback) {
    ensure(dir, "string").and(callback, "function");

    var localDir = LocalPath(blogID, dir);

    fs.readdir(localDir, function(err, contents) {
      if (err) return callback(err);

      forEach(
        contents,
        function(fileName, next) {
          if (fileName === ".DS_Store") return next();

          var localPath = joinPath(localDir, fileName);
          var path = joinPath(dir, fileName);

          fs.stat(localPath, function(err, stat) {
            if (err) return callback(err);

            if (stat.isDirectory()) return check(path, next);

            checkIfWeKnow(blogID, path, function(err, weKnow) {
              if (err) return callback(err);

              if (weKnow) {
                emit("✓ " + path);
                return next();
              }

              emit("x Nothing exists for file " + path);
              changes.push(makeStat(path, stat));

              return next();
            });
          });
        },
        function() {
          emit("✓ " + dir);
          return callback(null, changes);
        }
      );
    });
  };
};

function IsPublic(path) {
  return normalize(path).indexOf("/public/") === 0;
}

function IsTemplate(path) {
  return normalize(path).indexOf("/templates/") === 0;
}

function checkIfWeKnow(blogID, path, callback) {
  var emit = new Emit(blogID);

  var know = 0;

  Entry.get(blogID, path, function(entry) {
    var isEntry = entry && !entry.deleted;
    var isPublic = IsPublic(path);
    var isTemplate = IsTemplate(path);

    Ignored.isIt(blogID, path, function(err, isIgnored) {
      if (isEntry) know++;

      if (isIgnored) know++;

      if (isPublic) know++;

      if (isTemplate) know++;

      if (know === 1) return callback(null, true);

      if (know === 0) return callback(null, false);

      // know > 1, there's a conflict

      emit(
        "x Dropping " +
          path +
          " from Ignored list, Entries list since it is on more than one of them"
      );

      dropItem(blogID, path, function() {
        return callback(null, false);
      });
    });
  });
}

function dropItem(blogID, path, callback) {
  Ignored.drop(blogID, path, function() {
    Entry.drop(blogID, path, callback);
  });
}
