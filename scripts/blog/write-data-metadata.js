var Entries = require("entries");
var fs = require('fs-extra');
var get = require("../get/blog");
var moment = require('moment');
var yesno = require('yesno');
var localPath = require('helper').localPath;
var path = require('path');
var SUPPORTED_EXTENSIONS = ['.txt', '.md'];
require("moment-timezone");
get(process.argv[2], function(err, user, blog) {
  console.log('')
  var client = require("../../app/clients")[blog.client];
  Entries.each(
    blog.id,
    function(entry, next) {
      var contents, hasMetadata, dateMetadata;
      if (entry.metadata.date) return next();
      if (SUPPORTED_EXTENSIONS.indexOf(path.extname(entry.path)) === -1) {
        console.log(entry.path, 'Cannot add metadata to unsupported file type')
        return next();
      }
      console.log(entry.path, 'reading');
      contents = fs.readFileSync(localPath(blog.id, entry.path), 'utf8');
      hasMetadata = Object.keys(entry.metadata).length > 0;
      dateMetadata = 'Date: ' + moment
        .utc(entry.dateStamp)
        .tz(blog.timeZone)
        .format('MMMM D, Y');
      console.log('hasMetadata', hasMetadata);
      if (hasMetadata) {
        contents = dateMetadata + '\n' + ltrim(contents);
      } else {
        contents = dateMetadata + '\n\n' + ltrim(contents);
      }
      console.log('--------------------------');
      console.log(contents);
      console.log('--------------------------');
      yesno.ask('Write? (y/n)', false, function(ok) {
        if (!ok) return next();
        console.log(entry.path, 'writing');
        client.write(blog.id, entry.path, contents, next);
      });
    },
    function() {
      console.log("Done!");
      process.exit();
    }
  );
});

function ltrim(str) {
  if (!str) return str;
  return str.replace(/^\s+/g, '');
}