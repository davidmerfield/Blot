var helper = require('../helper');
var ensure = helper.ensure;
var forEach = helper.forEach;
var Entry = require('../models/entry');

module.exports = function (blogID, doThis, callback) {

  ensure(blogID, 'string')
    .and(doThis, 'function')
    .and(callback, 'function');

  Entry.getAllIDs(blogID, function(err, entryIDs){

    Entry.get(blogID, entryIDs, function(entries){

      forEach(entries, doThis, callback);
    });
  });
};