var helper = require('../../helper');
var ensure = helper.ensure;
var forEach = helper.forEach;

var getAllIDs = require('./getAllIDs');
var getBlog = require('../blog/get');
var get = require('./get');
var set = require('./set');

var DateStamp = require('./build/prepare/dateStamp');

module.exports = function (blogID, callback) {

  callback = callback || function(){};

  ensure(blogID, 'string')
    .and(callback, 'function');

  getBlog({id: blogID}, function(err, blog){

    if (err || !blog) throw err || 'No blog';

    getAllIDs(blogID, function(err, entryIDs){

      if (err || !entryIDs) throw err || 'No entry';

      get(blogID, entryIDs, function(entries){

        forEach(entries, function(entry, nextEntry){

          var dateStamp = DateStamp(blog, entry.path, entry.metadata);

          // This is fine!
          if (dateStamp === undefined) return nextEntry();

          set(blogID, entry.id, {dateStamp: dateStamp}, nextEntry);

        }, callback);
      });
    });
  });
};