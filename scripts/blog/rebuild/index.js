var get = require("./get");
var Entries = require('../../app/models/entries');
var Entry = require('../../app/models/entry');
var build = require('../../app/build');

if (require.main === module) {
  get(process.argv[2], function(user, blog) {
    main(blog, function(err) {
      if (err) throw err;
      process.exit();
    });
  });
}

function main(blog, callback) {
  console.log('Blog ' + blog.id + ':', 'Rebuilding entries...');
  Entries.each(
    blog.id,
    function(_entry, next) {
      build(blog, _entry.path, function(err, entry){

        if (err && err.code === 'ENOENT' && _entry.deleted) {
          return next();
        }

        if (err) {
          console.log('-', _entry.path, err, _entry);
          return next();
        } else {
          console.log('-', _entry.path);
        }

        Entry.set(blog.id, entry.path, entry, next);
      });
    },
    function(err){
      if (err) return callback(err);
      console.log('Blog ' + blog.id + ':', 'Rebuilt all entries!');
      callback();
    }
  );
}

module.exports = main;
