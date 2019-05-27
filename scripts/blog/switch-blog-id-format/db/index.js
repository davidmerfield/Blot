var async = require("async");
var client = require("client");
var colors = require("colors/safe");

function main(oldBlogID, newBlogID, callback) {
  var multi = client.multi();

  before(multi, oldBlogID, newBlogID, function(err) {
    if (err) return callback(err);

    console.log(
      colors.dim("Blog: " + oldBlogID) + " Modifying database keys"
    );

    redisKeys(
      "*",
      function(keys, next) {
        var tasks = [
          require("./renameBlogKeys"),
          require("./renameDomainKeys"),
          require("./renameHandleKeys"),
          require("./renameTemplateKeys"),
          require("./switchSessionID")
        ].map(function(task) {
          return task.bind(null, keys, multi, oldBlogID, newBlogID);
        });

        async.series(tasks, next);
      },
      function(err) {
        if (err) return callback(err);
        console.log(
          colors.dim("Blog: " + oldBlogID) + " Modified all database keys"
        );
        multi.exec(callback);
      }
    );
  });
}

function pad(x, len, str) {
  x = x.toString();
  while (x.length < len) x = (str || "0") + x;
  return x;
}

function before(multi, oldBlogID, newBlogID, callback) {
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

    callback();
  });
}

function redisKeys(pattern, fn, callback) {
  var complete;
  var cursor = "0";

  client.dbsize(function(err, total) {
    if (err) return callback(err);
    var processed = 0;
    var totalLen = total.toString().length;

    client.scan(cursor, "match", pattern, "count", 1000, function then(
      err,
      res
    ) {
      if (err) return callback(err);

      cursor = res[0];

      fn(res[1], function(err) {
        if (err) return callback(err);

        processed += res[1].length;

        complete = cursor === "0";

        if (complete) {
          callback(err);
        } else {
          process.stdout.write(
            pad(Math.floor((processed / total) * 100), 3, " ") +
              "% " +
              colors.dim(pad(processed, totalLen) + "/" + total + '\r')
          );
          client.scan(cursor, "match", pattern, "count", 1000, then);
        }
      });
    });
  });
}

module.exports = main;
