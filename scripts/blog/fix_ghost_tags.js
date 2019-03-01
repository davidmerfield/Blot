var get = require("./get");
var yesno = require("yesno");
var Tags = require("../../app/models/tags");
var Entries = require("../../app/models/entries");
var Entry = require("../../app/models/entry");
var localPath = require("../../app/helper").localPath;
var fs = require("fs");
var async = require("async");
var host = require("../../config").host;

if (require.main === module) {
  get(process.argv[2], function(user, blog) {
    main(blog, function(err) {
      if (err) throw err;
      process.exit();
    });
  });
}

function main(blog, callback) {
  var missing = [];

  Tags.list(blog.id, function(err, tags) {
    async.eachSeries(
      tags,
      function(tag, next) {
        console.log(tag.slug,':');
        async.eachSeries(
          tag.entries,
          function(path, next) {

            if (fs.existsSync(localPath(blog.id, path))) {
              console.log("file for blog post exists", path);
              return next();
            }

            console.log("file for blog post is missing", path);
            missing.push(path);
          },
          next
        );
      },
      callback
    );
  });
}

module.exports = main;
