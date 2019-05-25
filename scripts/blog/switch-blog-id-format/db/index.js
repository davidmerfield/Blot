var async = require("async");
var client = require("client");
var debug = require("debug")("blot:scripts:set-blog-id:db");
function main(oldBlogID, newBlogID, callback) {
  debug("switching db keys", oldBlogID, newBlogID);
  before(oldBlogID, newBlogID, function(err) {
    debug("handled before tasks");

    if (err) return callback(err);
    redisKeys(
      "*",
      function(keys, next) {
        debug("iterating...");
        var multi = client.multi();
        var tasks = [
          require("./renameBlogKeys"),
          require("./renameDomainKeys"),
          require("./renameHandleKeys"),
          require("./renameTemplateKeys"),
          require("./switchSessionID")
        ].map(function(task) {
          return task.bind(null, keys, multi, oldBlogID, newBlogID);
        });

        async.series(tasks, function(err) {
          if (err) return next(err);

          debug("iterated...");
          multi.exec(next);
        });
      },
      callback
    );
  });
}

function before(oldBlogID, newBlogID, callback) {
  var multi = client.multi();

  multi.sadd("blogs", newBlogID);
  multi.srem("blogs", oldBlogID);

  client.smembers("template:owned_by:" + oldBlogID, function(
    err,
    oldTemplateIDs
  ) {
    oldTemplateIDs.forEach(function(oldTemplateID) {
      var newTemplateID = oldTemplateID
        .split(oldBlogID + ":")
        .join(newBlogID + ":");

      multi.srem("template:owned_by:" + oldBlogID, oldTemplateID);
      multi.sadd("template:owned_by:" + oldBlogID, newTemplateID);

      multi.hset("template:" + oldTemplateID + ":info", "owner", newBlogID);
      multi.hset("template:" + oldTemplateID + ":info", "id", newTemplateID);
    });

    multi.rename(
      "template:owned_by:" + oldBlogID,
      "template:owned_by:" + newBlogID
    );

    multi.exec(callback);
  });
}

function redisKeys(pattern, fn, callback) {
  var complete;
  var cursor = "0";

  client.scan(cursor, "match", pattern, "count", 1000, function then(err, res) {
    if (err) return callback(err);

    cursor = res[0];

    console.log(cursor);

    fn(res[1], function(err) {
      if (err) return callback(err);

      complete = cursor === "0";

      if (complete) {
        callback(err);
      } else {
        client.scan(cursor, "match", pattern, "count", 1000, then);
      }
    });
  });
}

module.exports = main;
