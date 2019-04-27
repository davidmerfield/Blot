var get = require("./get");
var yesno = require("yesno");
var Entry = require("../../app/models/entry");
var Entries = require("../../app/models/entries");
var client = require("../../app/models/client");
var assign = require("../../app/models/entry/_assign");
var localPath = require("../../app/helper").localPath;
var fs = require("fs");
var async = require("async");
var host = require("../../config").host;

var lists = ["all", "created", "entries", "drafts", "scheduled", "pages"];

if (require.main === module) {
  get(process.argv[2], function(user, blog) {
    main(blog, function(err) {
      if (err) throw err;
      process.exit();
    });
  });
}

function main(blog, callback) {
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
