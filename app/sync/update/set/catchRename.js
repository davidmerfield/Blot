var helper = require('helper');
var ensure = helper.ensure;
var async = require('async');
var equal = require('lodash').isEqual;
var Entries = require('entries');
var Entry = require('entry');
var get = Entry.get;
var set = Entry.set;

var RENAME_PERIOD = 1000 * 60; // 1 minute

function forCreated (blog, newEntry, callback) {

  ensure(blog, 'object')
    .and(newEntry, 'object')
    .and(callback, 'function');

  var log = new Log(blog.id);

  log(newEntry.path, ':: Checking recently deleted entries to ensure this is not a rename');

  // One minute ago
  var after = Date.now() - RENAME_PERIOD;

  Entries.getDeleted(blog.id, after, function(err, deleted){

    if (err) return callback(err);

    findSimilar(newEntry, deleted, function (err, similar, score) {

      if (err) return callback(err);

      if (!similar) {
        log(newEntry.path, ':: No recently deleted entry matched this entry');
        return callback();
      }

      var changes = {
        url: similar.url,
        created: similar.created,
        guid: similar.guid
      };

      log(newEntry.path, ':: Found a recently deleted entry which is similar to this entry:', similar.path, similar.guid, new Date(similar.created), '(' + score + ')');
      return callback(null, changes);
    });
  });
}

function forDeleted (blog, path, callback) {

  ensure(blog, 'object')
    .and(path, 'string')
    .and(callback, 'function');

  var log = new Log(blog.id);

  get(blog.id, path, function(deletedEntry){

    if (!deletedEntry) return callback();

    log(deletedEntry.path, ':: Checking entry to be deleted is not a rename of a recently created file');

    var after = Date.now() - RENAME_PERIOD;

    if (deletedEntry.created > after && deletedEntry.created < Date.now())
      after = deletedEntry.created;

    Entries.getCreated(blog.id, after, function(err, recentlyCreated){

      if (err) return callback(err);

      findSimilar(deletedEntry, recentlyCreated, function (err, similar, score) {

        if (err) return callback(err);

        if (!similar) {
          log(deletedEntry.path, ':: No recently created entry matched this entry');
          return callback();
        }

        log(deletedEntry.path, ':: Found a recently created entry which is similar to the entry to be deleted:', similar.path, similar.guid, new Date(similar.created), '(' + score + ')');

        var changes = {
          url: deletedEntry.url,
          guid: deletedEntry.guid,
          created: deletedEntry.created
        };

        // we need to make sure the date stamp updates too?
        // we need to rethink entry / build so that entries
        // with metadata removed revert to original created?
        if (similar.dateStamp === similar.created)
          changes.dateStamp = changes.created;

        set(blog, similar.path, changes, callback);
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

  async.eachSeries(entries, function(candidate, next){

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

function Log (blogID) {
  return console.log.bind(this, 'Blog: ' + blogID + ':');
}

module.exports = {
  forCreated: forCreated,
  forDeleted: forDeleted
};