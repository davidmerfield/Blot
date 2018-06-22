var fs = require("fs");
var Ignored = require("ignoredFiles");
var Entry = require("entry");
var Entries = require("entries");

var helper = require("helper");
var ensure = helper.ensure;
var type = helper.type;
var forEach = helper.forEach;
var LocalPath = helper.localPath;

var Emit = require("./emit");

function ignoredFiles(blogID, callback) {
  ensure(blogID, "string").and(callback, "function");

  var check = Check(blogID, "ignored files");

  Ignored.get(blogID, function(err, files) {
    forEach(
      files,
      function(path, reason, next) {
        ensure(path, "string")
          .and(reason, "string")
          .and(next, "function");

        var localPath = LocalPath(blogID, path);
        var dropIgnored = Ignored.drop.bind(this, blogID, path);

        check(localPath, dropIgnored, next);
      },
      callback
    );
  });
}

function entries(blogID, callback) {
  ensure(blogID, "string").and(callback, "function");

  var check = Check(blogID, "entries");

  Entries.each(
    blogID,
    function(entry, next) {
      if (!type(entry, "object")) {
        console.log("ERROR: Entry not object for blog:", blogID);
        return next();
      }

      if (entry.deleted) return next();

      var path = entry.path;
      var localPath = LocalPath(blogID, path);
      var dropEntry = Entry.drop.bind(this, blogID, path);

      check(localPath, dropEntry, next);
    },
    callback
  );
}

function Check(blogID, list) {
  ensure(blogID, "string").and(list, "string");

  var emit = Emit(blogID);

  return function check(path, method, callback) {
    ensure(path, "string")
      .and(method, "function")
      .and(callback, "function");

    fs.stat(path, function(err) {
      if (err && err.code === "ENOENT") {
        emit("x Removing " + path + " from list of " + list);
        method(callback);
      } else {
        emit("✓ " + list + " " + path);
        callback();
      }
    });
  };
}

module.exports = function(blogID, callback) {
  ignoredFiles(blogID, function() {
    entries(blogID, callback);
  });
};
