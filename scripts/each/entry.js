var helper = require('../../app/helper');
var forEach = helper.forEach;
var ensure = helper.ensure;
var Entry = require('../../app/models/entry');
var eachBlog = require('./blog');

module.exports = function (doThis, allDone, options) {

  options = options || {};

  ensure(doThis, 'function')
    .and(allDone, 'function')
    .and(options, 'object');

  eachBlog(function (user, blog, nextBlog) {

    Entry.getAllIDs(blog.id, function(err, entryIDs){

      console.log();
      console.log();
      console.log(blog.id + '.', user.name, '(' + blog.handle + ')', entryIDs.length, 'entries');
      console.log('----------------------------------------------------');

      forEach(entryIDs, function(entryID, nextEntry){

        Entry.get(blog.id, entryID, function(entry){

          if (entry === null || entry === undefined)
            entry = entryID;

          doThis(user, blog, entry, nextEntry);

        });
      }, nextBlog);
    });
  }, allDone, options);
};