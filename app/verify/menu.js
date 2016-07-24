var Entry = require('../models/entry');

var eachEntry = require('./eachEntry');

var redis = require('redis').createClient();
var Emit = require('./emit');
var helper = require('../helper');
var ensure = helper.ensure;

module.exports = function (blogID, callback) {

  ensure(blogID, 'string')
    .and(callback, 'function');

  var emit = new Emit(blogID);

  return callback();

  // Blog.get({id: blogID}, function(err, blog){

  //   console.log(blog.menu);
  //   callback();
  // });

  // eachEntry(blogID, function(entry, nextEntry){

  //   ensure(entry, 'object')
  //     .and(entry.id, 'number')
  //     .and(nextEntry, 'function');

  //   var pathKey = Entry.key.path(blogID, entry.path);

  //   redis.get(pathKey, function(err, pathKeyID){

  //     if (err) throw err;

  //     if (!pathKeyID) {
  //       emit('Stored path key ' + entry.path + ' for entry id ' + entry.id);
  //       return redis.set(pathKey, entry.id, nextEntry);
  //     }

  //     // Entry IDs are numbers, oddly
  //     pathKeyID = parseInt(pathKeyID);

  //     // The stored path key matches
  //     // the entry's ID
  //     if (pathKeyID === entry.id) {
  //       emit('✓ ' + entry.path);
  //       return nextEntry();
  //     }

  //     // NOO THERES CONFLICTING IDs
  //     emit('x Two entries with same path (' + pathKeyID + ' & ' + entry.id + ') ' + entry.path);
  //     return resolvePathConflict(blogID, pathKeyID, entry.id, nextEntry);
  //   });
  // }, callback);
};