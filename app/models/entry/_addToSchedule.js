var scheduler = require("node-schedule");
var scheduled = {};
var helper = require("helper");
var ensure = helper.ensure;
var model = require("./model");

module.exports = function(blogID, entry, callback) {
  ensure(blogID, "string")
    .and(entry, model)
    .and(callback, "function");

  var set = require("./set");

  // If the entry is scheduled for future publication,
  // register an event to update the entry. This is
  // neccessary to switch the 'scheduled' flag
  if (!entry.scheduled) return callback();

  // Refresh will perform a re-save of the entry
  var refresh = set.bind(this, blogID, entry.path, {}, function() {
    require("blog").set(blogID, { cacheID: Date.now() }, function(err) {
      console.log(
        "Blog:",
        blogID + ":",
        "Published entry as scheduled!",
        entry.path
      );
    });
  });

  // This key is to ensure one event per entry
  // this needs to be stored to a queue in redis
  // so we don't need to build this expensively on restart
  var key = [blogID, entry.path, entry.dateStamp].join(":");
  var at = new Date(entry.dateStamp);

  if (scheduled[key] === undefined) {
    scheduled[key] = scheduler.scheduleJob(at, refresh);
  }

  return callback();
};
