var helper = require('../../helper');
var ensure = helper.ensure;
var forEach = helper.forEach;
var equal = require('lodash').isEqual;
var Entries = require('../entries');
var get = require('./get');
var set = require('./set');
var rename = require('./rename');

function forCreated (blogID, newEntry, callback) {

  ensure(blogID, 'string')
    .and(newEntry, 'object')
    .and(callback, 'function');

  var log = new Log(blogID);

  log('Checking new entry is not a rename of a deleted file!', newEntry.path);

  getRecentlyDeleted(blogID, function(err, recentlyDeleted){

    if (err) return callback(err);

    findSimilar(newEntry, recentlyDeleted, function (err, similar, score) {

      if (err) return callback(err);

      if (!similar) {
        log('No recently deleted entry matched this new entry', newEntry.path);
        return callback();
      }

      log('Found a similar deleted entry!', similar.path, 'with a score of', score);

      rename(blogID, similar.path, newEntry.path, function(err){

        if (err) throw err;

        log('Setting similar deleted entry to visible, with new entry\'s properties!', similar.id);

        set(blogID, similar.id, newEntry, function(err) {

          if (err) throw err;

          callback(null, true);
        });
      });
    });
  });
}

function forDeleted (blogID, deletedEntry, callback) {

  ensure(blogID, 'string')
    .and(deletedEntry, 'object')
    .and(callback, 'function');

  var log = new Log(blogID);

  log('Checking entry to be deleted is not a rename of a recently created file!', deletedEntry.path);

  // we only want to consider created entries with
  // a BLOT created date after this entry's BLOT created date.

  getRecentlyCreated(blogID, deletedEntry, function(err, recentlyCreated){

    if (err) return callback(err);

    findSimilar(deletedEntry, recentlyCreated, function (err, similar, score) {

      if (err) return callback(err);

      if (!similar) return callback();

      log('Found a similar created entry!', similar.path, 'with a score of', score);

      // size: 0, // this prevents the entry from being considered similar in future?
      var hidden = {
          deleted: true,
          path: deletedEntry.path
      };

      log('Setting recently created similar entry to deleted!');

      set(blogID, similar.id, hidden, function(err){

        if (err) return callback(err);

        log('Renaming entry to be deleted to the recently created\'s path!');

        rename(blogID, deletedEntry.path, similar.path, function(err){

          if (err) return callback(err);

          set(blogID, deletedEntry.id, {path: similar.path}, function (err) {

            if (err) return callback(err);

            callback(null, true);
          });
        });
      });
    });
  });
}

function calculateSimilarity (first, second) {

  ensure(first, 'object')
    .and(second, 'object');

  // It's possible that an entry to be deleted
  // will show up on the list of entries that were
  // recently created. Therefore, return false
  // if the IDs match.

  // console.log('Comparing', first.path, second.path);
  if (first.id === second.id || first.path === second.path)
    return false;

  var score = 0;

  // page, menu, render, scheduled, draft, deleted, render, metadata, retrieve, partials
  // don't really tell you much about whether the entries
  // are similar. Therefore, we set a minimum threshold of 10
  // for entries to be considered similar. most truly similar entries
  // will score 15+ on this test, with identical:
  // - permalinks
  // - title,
  // - titletags
  // - summary
  // - teaser
  // - slug
  // - size
  // - tags
  // - metadata

  var check = [

    // weak (two different entries might have null for these)
    'permalink',
    'tags',
    'dateStamp',

    // strong
    'title',
    'titleTag',
    'updated', // file mtime
    'summary',
    'teaser',
    'slug',
    'size'
  ];

  for (var i = 0; i < check.length; i++) {

    var key = check[i];

    // Sometimes a created entry doesn't have a datestamp
    // don't freak out...
    if (first[key] === undefined && second[key] === undefined) {
      // console.log('>',key,'is missing from both entries');

    // We only score if one entry has a truthy value.
    // This allows us to avoid giving credit to two entries
    // without permalinks, tags or datestamps...
    } else if (!first[key] && !second[key]) {
      // console.log('>',key,'are both falsy');

    } else if (equal(first[key], second[key])) {
      // console.log('>',key,'are both the same!');
      score++;

    } else {
      // console.log('>',key,'are different :(');
    }
  }

  // console.log('>> SCORE', score);

  // We set a floor of 3, due to the first
  // three weak comparators.
  if (score <= 3) score = 0;

  return score;
}

function findSimilar (entry, entries, callback) {

  ensure(entry, 'object')
    .and(entries, 'array')
    .and(callback, 'function');

  var similar;
  var bestScore = 0;

  forEach(entries, function(candidate, next){

    var score = calculateSimilarity(entry, candidate);

    if (score > bestScore) {
      similar = candidate;
      bestScore = score;
    }

    next();

  }, function(){

    callback(null, similar, bestScore);
  });
}

function getRecentlyCreated (blogID, deletedEntry, callback) {

  ensure(blogID, 'string')
    .and(deletedEntry, 'object')
    .and(callback, 'function');

  // Would be nice to have a list of entries sorted by created
  // date, not publish date. We don't have that sadly yet. So instead
  // we fetch the 100 most recent entries by publish date, then
  // see if their created date was greater than 5 minutes ago.
  Entries.getListIDs(blogID, 'entries', {first: 100}, function(err, ids){

    if (err) throw err;

    get(blogID, ids, function (entries) {

      var candidates = [];
      var fiveMinutesAgo = Date.now() - (1000 * 60 * 5);

      for (var i = 0;i < entries.length; i++) {

        var entry = entries[i];

        // don't consider entries created before
        // the deleted entry. that's a different job
        if (entry.id < deletedEntry.id) continue;

        if (entry.created > fiveMinutesAgo)
          candidates.push(entry);
      }

      return callback(null, entries);
    });
  });
}

function getRecentlyDeleted (blogID, callback) {

  ensure(blogID, 'string')
    .and(callback, 'function');

  Entries.getListIDs(blogID, 'deleted', {first: 50}, function(err, ids){

    if (err) throw err;

    get(blogID, ids, function (entries) {

      return callback(null, entries);
    });
  });
}

function Log (blogID) {
  return console.log.bind(this, 'Blog: ' + blogID + ':');
}

module.exports = {
  forCreated: forCreated,
  forDeleted: forDeleted
};