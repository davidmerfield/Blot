var helper = require("helper");
var ensure = helper.ensure;
var doEach = helper.doEach;

var model = require("./model");
var redis = require("client");

var guid = helper.guid;

var get = require("./get");
var key = require("./key");
var setUrl = require("./_setUrl");

// Queue items
var rebuildDependencyGraph = require("./_rebuildDependencyGraph");
var updateSearchIndex = require("./_updateSearchIndex");
var updateTagList = require("../tags").set;
var addToSchedule = require("./_addToSchedule");
var notifyDrafts = require("./_notifyDrafts");
var assignToLists = require("./_assign");

// Set is a private method which takes any valid
// properties in the updates param and then overwrites those.
// Also updates entry properties which affect data stored
// elsewhere such as created date, permalink etc..
module.exports = function set(blogID, path, updates, callback) {
  ensure(blogID, "string")
    .and(path, "string")
    .and(updates, model)
    .and(callback, "function");

  var entryKey = key.entry(blogID, path);
  var queue;

  // Get the entry stored against this ID
  get(blogID, path, function(entry) {
    // Create an empty object if new entry
    entry = entry || {};

    var previous_dependencies = entry.dependencies
      ? entry.dependencies.slice()
      : [];

    // Overwrite any updates to the entry
    for (var i in updates) entry[i] = updates[i];

    if (entry.guid === undefined) entry.guid = "entry_" + guid();

    // This is for new entries
    if (entry.created === undefined) entry.created = Date.now();

    if (entry.dateStamp === undefined) entry.dateStamp = entry.created;

    // ToDO remove this and ensure all existing entries have been rebuilt
    if (entry.dependencies === undefined) entry.dependencies = [];

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

    setUrl(blogID, entry, function(err, url) {
      // Should be pretty serious (i.e. issue with DB)
      if (err) return callback(err);

      // URL will be an empty string for
      // drafts, scheduled entries and deleted entries
      entry.url = url;

      // Ensures entry has all the
      // keys it should have and no more
      ensure(entry, model, true);

      // Store the entry
      redis.set(entryKey, JSON.stringify(entry), function(err) {
        if (err) return callback(err);

        queue = [
          updateSearchIndex.bind(this, blogID, entry),
          updateTagList.bind(this, blogID, entry),
          assignToLists.bind(this, blogID, entry),
          rebuildDependencyGraph.bind(
            this,
            blogID,
            entry,
            previous_dependencies
          )
        ];

        if (entry.scheduled)
          queue.push(addToSchedule.bind(this, blogID, entry));

        if (entry.draft) queue.push(notifyDrafts.bind(this, blogID, entry));

        doEach(queue, function() {
          if (entry.deleted) {
            console.log("Blog:", blogID, "Entry:", path, "deleted");
          } else {
            console.log("Blog:", blogID, "Entry:", path, "updated");
          }
          callback(null);
        });
      });
    });
  });
};
