var Blog = require('blog');
var Entries = require('entries');
var Entry = require('entry');
var DateStamp = require('../../../models/entry/build/prepare/dateStamp');

module.exports = function(blogID, callback) {

  Blog.get({id: blogID}, function(err, blog){

    Entries.each(blogID, function(entry, nextEntry){

      var dateStamp = DateStamp(blog, entry.path, entry.metadata);

      // This is fine!
      if (dateStamp === undefined) return nextEntry();

      Entry.set(blogID, entry.path, {
        dateStamp: dateStamp
      }, nextEntry);

    }, callback);
  });
};