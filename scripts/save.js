var eachBlog = require('./each/blog');
var Entries = require('../app/models/entries');
var Entry = require('../app/models/entry');
var options = require('minimist')(process.argv.slice(2));

eachBlog(function (user, blog, nextBlog) {

  console.log(blog.id, user.name);

  Entries.each(blog.id, function(entry, nextEntry){

    Entry.set(blog.id, entry.path, entry, function(err){

      if (err) throw err;

      nextEntry();
    });
  }, nextBlog);

}, process.exit, options);