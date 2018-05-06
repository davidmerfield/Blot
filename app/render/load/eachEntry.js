// could I create an entry class which would be easy to detect?
// and an entry list class?

// this also needs to do entry.next
// entry.previous

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

      if (key === 'partials' && !depth) {
        continue;
      }

      if (local instanceof Entry) {
        modify(local);
        continue;
      }

      if (type(local, 'array') && !(local[0] instanceof Entry)) {

        // Make modifications to this entry list
        local = list(local);

        continue;
      }


      // This is an entry list, we could do shit to it too
      if (type(local, 'array') && local[0] instanceof Entry) {

        // Make modifications to this entry list
        local = list(local);

        for (var entry in local)
          modify(local[entry]);

        continue;
      }

      if (type(local, 'object') || type(local, 'array')) {
        check(local, ++depth);
      }

    }
  }
};