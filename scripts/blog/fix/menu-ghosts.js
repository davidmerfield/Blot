var Entry = require("../../../app/models/entry");
var Blog = require("../../../app/models/blog");
var async = require("async");
var yesno = require("yesno");
var host = require("../../../config").host;

var existing = {};

function main(blog, callback) {
  var domain = "http://" + blog.handle + "." + host;

  console.log("Blog", blog.id, "(" + domain + ") Fixing menu");

  async.map(
    blog.menu,
    function(item, next) {
      Entry.get(blog.id, item.id, function(entry) {
        if (entry && entry.deleted) {
          console.log("Will delete", item);
          next(null, null);
        } else if (entry && existing[entry.id] === true) {
          console.log("Will delete", item, "which is duplicated on the menu");
          next(null, null);
        } else if (entry) {
          if (item.label !== entry.title) {
            item.label = entry.title;
            console.log(item.id, "setting label to", item.label);
          }

          if (item.metadata !== entry.metadata) {
            item.metadata = entry.metadata;
            console.log(item.id, "setting metadata to", item.metadata);
          }

          if (item.url !== entry.url) {
            item.url = entry.url;
            console.log(item.id, "setting url to", item.url);
          }

          existing[entry.id] = true;
          next(null, item);
        } else {
          if (entry) existing[entry.id] = true;
          next(null, item);
        }
      });
    },
    function(err, results) {
      if (err) return callback(err);

      results = results.filter(function(item) {
        return item !== null;
      });

      try {
        require("assert").deepStrictEqual(results, blog.menu);
      } catch (e) {
        console.log("Existing menu:");
        console.log(blog.menu);
        console.log();

        console.log();
        console.log("Fixed menu:");
        console.log(results);

        return yesno.ask("Save menu? (y/n)", false, function(yes) {
          if (!yes) {
            return callback(new Error("\nDid not apply changes"));
          }
          Blog.set(blog.id, { menu: results }, callback);
        });
      }

      callback();
    }
  );
}

module.exports = main;
