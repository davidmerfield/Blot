var helper = require('../../helper');
var ensure = helper.ensure;

var get = require('./get');

module.exports = function getFullEntry (blogID, entryID, callback, scheduled) {

  ensure(blogID, 'string')
    .and(entryID, 'number')
    .and(callback, 'function');

  var Entries = require('../entries');

  get(blogID, entryID, function(entry){

    if (!entry || entry.deleted || entry.draft)
      return callback(null);

    if (entry.scheduled && !scheduled)
      return callback(null);

    Entries.adjacentTo(blogID, entryID, function(next, previous){

      entry.next = next;
      entry.previous = previous;
      entry.adjacent = !!(next || previous);

      return callback(entry || null);
    });
  });
};