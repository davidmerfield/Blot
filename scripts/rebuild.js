var Entries = require('../app/models/entries');
var Entry = require('../app/models/entry');
var helper = require('../app/helper');
var forEach = helper.forEach;

var identifiers = process.argv.slice(2);
var get = require('./blog/get');

if (!identifiers.length) throw 'No identifier passed to script';

var only = [];

forEach(identifiers, function(id, next){

  get(id, function(user, blog){

    only.push(blog);

    next();
  });

}, function(){

  forEach(only, function(blog, nextBlog){

    console.log();
    console.log('BLOG:', blog.id, blog.handle);
    console.log('----------------------------');

    Entries.each(blog.id, function(entry, next){

      if (entry.deleted) return next();

      Entry.build(blog, entry.path, function(err, newEntry){

        if (err && err.code === 'ENOENT') {
          console.warn(entry.path, 'has no local file on disk');
          return next();
        }

        // don't know
        if (err) {
          console.log('-----> REBUILD ERROR');
          console.log(err);
          if (err.stack) console.log(err.stack);
          if (err.trace) console.log(err.trace);
          return next();
        }

        Entry.set(blog.id, entry.path, newEntry, function(err){

          if (err) throw err;

          console.log(entry.path, 'was rebuilt');
          next();
        });
      });
    }, nextBlog);
  }, process.exit);
});