var Entry = require('../models/entry');
var eachEntry = require('./eachEntry');
var helper = require('../helper');
var ensure = helper.ensure;
var forEach = helper.forEach;
var LocalPath = helper.localPath;
var Emit = require('./emit');


var Ignored = require('../models/ignoredFiles');
var Metadata = require('../models/metadata');

var fs = require('fs');

function ignoredFiles (blogID, callback) {

  ensure(blogID, 'string')
    .and(callback, 'function');

  var check = Check(blogID, 'ignored files');

  Ignored.get(blogID, function(err, files){

    forEach(files, function(path, reason, next){

      ensure(path, 'string')
        .and(reason, 'string')
        .and(next, 'function');

      var localPath = LocalPath(blogID, path);
      var dropIgnored = Ignored.drop.bind(this, blogID, path);

      check(localPath, dropIgnored, next);

    }, callback);
  });
}

function metadata (blogID, callback) {

  ensure(blogID, 'string')
    .and(callback, 'function');

  var check = Check(blogID, 'file metadata');

  Metadata.all(blogID, function(err, files){

    forEach(files, function(path, next){

      ensure(path, 'string')
        .and(next, 'function');

      var localPath = LocalPath(blogID, path);
      var dropPath = Metadata.drop.bind(this, blogID, path);

      check(localPath, dropPath, next);

    }, callback);
  });
}


function entries (blogID, callback) {

  ensure(blogID, 'string')
    .and(callback, 'function');

  var check = Check(blogID, 'entries');

  eachEntry(blogID, function (entry, next) {

    ensure(entry, 'object');

    if (entry.deleted) return next();

    var path = entry.path;
    var localPath = LocalPath(blogID, path);
    var dropEntry = Entry.drop.bind(this, blogID, path);

    check(localPath, dropEntry, next);

  }, callback);
}


function Check (blogID, list) {

  ensure(blogID, 'string')
    .and(list, 'string');

  var emit = Emit(blogID);

  return function check (path, method, callback) {

    ensure(path, 'string')
      .and(method, 'function')
      .and(callback, 'function');

    fs.stat(path, function(err){

      if (err && err.code === 'ENOENT') {

        emit('x Removing ' + path + ' from list of ' + list);
        method(callback);

      } else {
        emit('✓ ' + list + ' ' + path);
        callback();
      }

    });
  };
}

module.exports = function(blogID, callback){

  metadata(blogID, function(){

    ignoredFiles(blogID, function(){

      entries(blogID, callback);
    });
  });
};