var helper = require('../../helper');
var ensure = helper.ensure;
var doEach = helper.doEach;
var joinpath = require('path').join;

var cache = require('../../cache');
var model = require('./model');
var redis = require('../client');

var get = require('./get');
var key = require('./key');

var savePermalink = require('./_savePermalink');

// Queue items
var updateSearchIndex = require('./_updateSearchIndex');
var updateTagList = require('../tags').set;
var addToSchedule = require('./_addToSchedule');
var notifyDrafts = require('./_notifyDrafts');
var assignToLists = require('./_assign');

// Set is a private method which takes any valid
// properties in the updates param and then overwrites those.
// Also updates entry properties which affect data stored
// elsewhere such as created date, permalink etc..
module.exports = function set (blogID, path, updates, callback) {

  ensure(blogID, 'string')
    .and(path, 'string')
    .and(updates, model)
    .and(callback, 'function');

  var entryKey = key.entry(blogID, path);
  var queue;

  // Get the entry stored against this ID
  get(blogID, path, function(entry){

    // Create an empty object if new entry
    entry = entry || {};

    // Overwrite any updates to the entry
    for (var i in updates)
      entry[i] = updates[i];

    if (entry.dateStamp === undefined)
      entry.dateStamp = entry.created;

    entry.scheduled = entry.dateStamp > Date.now();

    // Draft entries should not be in the
    // menu or scheduled list
    if (entry.draft) {
      entry.menu = entry.page = entry.scheduled = false;
    }

    // Scheduled entries should not be in the menu
    if (entry.scheduled) {
      entry.menu = entry.page = false;
    }

    // Deleted entries not be in the menu,
    // drafts folder or scheduled list
    if (entry.deleted) {
      entry.menu = entry.page = entry.draft = entry.scheduled = false;
    }

    savePermalink(blogID, entry, function(err) {

      if (err) {
        entry.url = joinpath('/', entryID + '', entry.slug);
      } else {
        entry.url = entry.permalink;
      }

      // Ensures entry has all the
      // keys it should have and no more
      ensure(entry, model, true);

      // Store the entry
      redis.set(entryKey, JSON.stringify(entry), function(err){

        if (err) return callback(err);

        queue = [
          updateSearchIndex.bind(this, blogID, entry),
          updateTagList.bind(this, blogID, entry),
          assignToLists.bind(this, blogID, entry)
        ];

        if (entry.scheduled)
          queue.push(addToSchedule.bind(this, blogID, entry));

        if (entry.draft)
          queue.push(notifyDrafts.bind(this, blogID, entry));

        doEach(queue, function(err){

          cache.clear(blogID, callback);
        });
      });
    });
  });
};