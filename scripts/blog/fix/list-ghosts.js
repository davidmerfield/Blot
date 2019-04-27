var Entry = require("../../../app/models/entry");
var client = require("../../../app/models/client");
var async = require("async");
var host = require("../../../config").host;

var lists = ["all", "created", "entries", "drafts", "scheduled", "pages"];

function main(blog, callback) {
  var domain = "http://" + blog.handle + "." + host;
  console.log("Blog", blog.id, "(" + domain + ") Fixing entry lists");

  async.each(
    lists,
    function(list, next) {
      client.zrevrange("blog:" + blog.id + ":" + list, 0, -1, function(
        err,
        res
      ) {
        if (err) return next(err);
        async.each(
          res,
          function(id, next) {
            Entry.get(blog.id, id, function(entry) {
              if (entry.id === id) return next();

              console.log(list, "MISMATCH", id, entry.id);

              client.zrem("blog:" + blog.id + ":" + list, id, function(err) {
                if (err) return next(err);
                Entry.set(blog.id, entry.id, entry, next);
              });
            });
          },
          next
        );
      });
    },
    callback
  );
}

module.exports = main;
