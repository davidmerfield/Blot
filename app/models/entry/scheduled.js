var ensure = require("helper/ensure");
var alarm = require("helper/alarm");
var clfdate = require("helper/clfdate");
var model = require("./model");

// Publishes future-dated entries. Each scheduled entry has an alarm in Redis
// (see helper/alarm), so any process can publish it and nothing is lost when
// the process that saved it goes away. The alarm id is blogID + ":" + path;
// blog IDs contain no colon but paths may, so split on the first colon only.
//
// When the alarm fires the entry is re-saved with an empty update, which
// recomputes entry.scheduled (now false), then the blog's cache is bumped.
// Delivery is at-least-once; re-saving a published entry is harmless.

function toID(blogID, path) {
  return blogID + ":" + path;
}

function fromID(id) {
  var i = id.indexOf(":");
  return { blogID: id.slice(0, i), path: id.slice(i + 1) };
}

function getEntry(blogID, path) {
  var get = require("./get");
  return new Promise(function (resolve, reject) {
    // Entry.get calls back (entry, err); on a read error entry is undefined,
    // which must not be mistaken for "no such entry"
    get(blogID, path, function (entry, err) {
      if (err) reject(err);
      else resolve(entry);
    });
  });
}

function setEntry(blogID, path) {
  var set = require("./set");
  return new Promise(function (resolve, reject) {
    set(blogID, path, {}, function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

function bumpCacheID(blogID) {
  var Blog = require("models/blog");
  return new Promise(function (resolve, reject) {
    Blog.bumpCacheID(blogID, function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

var alarms = alarm(
  "scheduled-entries",
  async function handler(id) {
    var parsed = fromID(id);
    var blogID = parsed.blogID;
    var path = parsed.path;
    var entry = await getEntry(blogID, path);

    // Gone, deleted or drafted: nothing to publish. An entry that is already
    // unscheduled may be a publication that failed part way (the re-save ran
    // but a later step didn't), so it falls through and is re-saved, which is
    // harmless for one that was published fine.
    if (!entry || entry.deleted || entry.draft) return;

    // Rescheduled to a later date since this alarm was set
    if (entry.dateStamp > Date.now()) {
      // A save can land between our read and our set, and its own hook may
      // already have run, so our set would leave its older date behind. Re-read
      // and correct until stable: the saver's hook runs after its write, so
      // this converges on the newest state.
      for (var attempt = 0; attempt < 3; attempt++) {
        await alarms.set(id, entry.dateStamp);
        var latest = await getEntry(blogID, path);

        if (!latest || !latest.scheduled) {
          await alarms.cancel(id);
          break;
        }

        if (latest.dateStamp === entry.dateStamp) break;

        entry = latest;
      }
      return;
    }

    // Re-saving cancels this alarm (the entry is no longer scheduled) in
    // parallel with the list updates, so if a later step fails the alarm is
    // already gone: re-arm it now so a later poll retries, then rethrow
    try {
      await setEntry(blogID, path);
      await bumpCacheID(blogID);
    } catch (err) {
      await alarms.set(id, Date.now());
      throw err;
    }

    console.log(clfdate(), "Blog:", blogID + ":", "Published entry as scheduled!", path);
  },
  { pollMs: 5000 }
);

// Called from entry.set for every save: arms the alarm if the entry is
// scheduled, otherwise cancels any alarm it had (date moved to the past,
// made a draft, deleted or dropped). Cancelling a missing alarm is a no-op.
function addToSchedule(blogID, entry, callback) {
  ensure(blogID, "string").and(entry, model).and(callback, "function");

  var id = toID(blogID, entry.path);
  var done = entry.scheduled
    ? alarms.set(id, entry.dateStamp)
    : alarms.cancel(id);

  done.then(function () {
    callback();
  }, callback);
}

addToSchedule.alarm = alarms;
addToSchedule.toID = toID;
addToSchedule.fromID = fromID;

module.exports = addToSchedule;
