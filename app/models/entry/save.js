var helper = require('../../helper');
var ensure = helper.ensure;
var logger = helper.logger;
var model = require('./model');
var redis = require('../client');

var key = require('./key');
var set = require('./set');
var catchRename = require('./_catchRename').forCreated;

var HOLD = 'HOLD';

module.exports = function save (blogID, entry, callback) {

  ensure(blogID, 'string')
    .and(entry, model)
    .and(entry.path, 'string')
    .and(callback, 'function');

  var path = entry.path;
  var pathKey = key.path(blogID, path);
  var nextEntryKey = key.nextEntryID(blogID);

  var check = redis
                .multi()
                .SETNX(pathKey, HOLD)
                .get(pathKey);

  check.exec(function(err, response){

    if (err) throw err;

    var available = response[0] === 1; // 1 or 0 depending on if it existed
    var existingID = response[1]; // null or string representing integer

    // This happens if multiple conccurent
    // to create entry with same path occur.
    if (existingID === HOLD && !available) {
      rebuffed(blogID, path);
      return callback();
    }

    // Existing ID is a number. When I move
    // to string IDs this will be much easier...
    // We must wait until after the first check
    // otherwise we will never actually hold...
    existingID = parseInt(existingID);

    if (!available && isNaN(existingID)) {
      badID(blogID, path, existingID);
      return callback();
    }

    // We have a valid ID, update the existing entry
    if (!available) {
      updated(blogID, entry.path);
      return set(blogID, existingID, entry, callback);
    }

    catchRename(blogID, entry, function(err, wasRenamed){

      if (err) throw err;

      if (wasRenamed) return callback();

      // We need to create an entry!
      redis.incr(nextEntryKey, function(err, entryID) {

        if (err) throw err;

        if (isNaN(entryID)) throw 'Invalid entry id ' + entryID;

        // The entry's created date is specified now
        // THe entry might contain a date specified in
        // its metadata. We'll compute that later.
        // This value should never be overwritten.
        entry.id = entryID;
        entry.created = Date.now();

        ensure(entry.id, 'number')
          .and(entry.created, 'number');

        // Store the entry's id againsts its path
        redis.set(pathKey, entryID, function(err){

          if (err) throw err;

          // Store the entry's info against its ID
          set(blogID, entryID, entry, callback);
          created(blogID, entry.path);
        });
      });
    });
  });
};

function rebuffed (blogID, path) {
  logger(null, 'Blog: ' + blogID + ': Rebuffed attempt to double-make entry', path);
}

function badID (blogID, path, existingID) {
  logger(null, 'Blog: ' + blogID + ': Could not parse entry ID for '+ path + ' ' + existingID);
}

function updated (blogID, path) {
  logger(null, 'Blog: ' + blogID + ': Updated entry', path);
}

function created (blogID, path) {
  logger(null, 'Blog: ' + blogID + ': Created entry', path);
}