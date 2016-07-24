var Entry = require('../models/entry');

var eachEntry = require('./eachEntry');

var redis = require('redis').createClient();
var Emit = require('./emit');
var helper = require('../helper');
var ensure = helper.ensure;

var resolvePathConflict = require('./resolvePathConflict');

module.exports = function (blogID, callback) {

  ensure(blogID, 'string')
    .and(callback, 'function');

  var emit = new Emit(blogID);

  eachEntry(blogID, function(entry, nextEntry){

    ensure(entry, 'object')
      .and(entry.id, 'number')
      .and(nextEntry, 'function');

    var pathKey = Entry.key.path(blogID, entry.path);

    redis.get(pathKey, function(err, pathKeyID){

      if (err) throw err;

      function store() {
        emit('Storing the entry ID ' + entry.id + ' against the path ' + entry.path);
        return redis.set(pathKey, entry.id, nextEntry);
      }

      try {
        pathKeyID = parseInt(pathKeyID);
      } catch (e) {
        emit('Could not parse number from pathKeyID ' + pathKeyID);
        return store();
      }

      if (isNaN(pathKeyID) || pathKeyID === null || pathKeyID === undefined) {
        emit('pathKeyID is not a valid entry ID');
        return store();
      }

      // The stored path key matches
      // the entry's ID
      if (pathKeyID === entry.id) {
        emit('✓ ' + entry.path);
        return nextEntry();
      }

      // NOO THERES CONFLICTING IDs
      emit('x Two entries with same path (' + pathKeyID + ' & ' + entry.id + ') ' + entry.path);
      return resolvePathConflict(blogID, pathKeyID, entry.id, nextEntry);
    });
  }, callback);
};