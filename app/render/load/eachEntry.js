// could I create an entry class which would be easy to detect?
// and an entry list class?

// this also needs to do entry.next
// entry.previous
var debug = require('debug')('blot:render:load:entry');
var helper = require('../../helper');
var type = helper.type;
var Entry = require('../../models/entry/instance');
var list = require('./list');

// THIS FUNCTION LOOKS FOR ENTRIES IN A VIEW"S LOCAL NEED

module.exports = function(locals, doThis) {

  function modify (entry) {

    doThis(entry);

    // Also augment adjacent entries...
    if (entry.next instanceof Entry)
      doThis(entry.next);

    if (entry.previous instanceof Entry)
      doThis(entry.previous);

  }

  check(locals, 0);

  function check (obj, depth) {

    for (var key in obj) {

      var local = obj[key];

      // Partials never contain an entry
      if (key === 'partials' && !depth) {
        continue;
      }

      // This is an entry, modify it now and proceed!
      if (local instanceof Entry) {
        modify(local);
      }

      // This is a list (not neccessarily of entries) 
      // so add the needed properties to it, e.g. 'first'.
      if (type(local, 'array')) {
        local = list(local);
      }

      // This is a list of entries so modify each and proceed
      // We assume that if the first item in the list is an
      // entry then the rest is too. This could be dumb.
      if (type(local, 'array') && local[0] instanceof Entry) {
        for (var entry in local)
          modify(local[entry]);
      }

      // Proceed down the tree!
      if (type(local, 'object') || type(local, 'array')) {
        check(local, ++depth);
      }

    }
  }
};