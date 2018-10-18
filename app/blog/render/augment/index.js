var helper = require("helper");
var type = helper.type;
var Entry = require("../../../models/entry/instance");
var list = require("./list");
var entry = require('./entry');

// then we check each entry in the view
// we determine a new list of partials
// and locals to retrieve based on those entries
// and retrieve them
// merging them into the view
// then returning req and res
module.exports = function(blog, locals) {

  check(locals, 0);

  function check(obj, depth) {
    for (var key in obj) {
      var local = obj[key];

      // Partials never contain an entry
      if (key === "partials" && !depth) {
        continue;
      }

      // This is an entry, modify it now and proceed!
      if (local instanceof Entry) {
        entry(blog)(local);
        continue;
      }

      // This is a list (not neccessarily of entries)
      // so add the needed properties to it, e.g. 'first'.
      if (type(local, "array")) {
        local = list(local);
      }

      // This is a list of entries so modify each and proceed
      // We assume that if the first item in the list is an
      // entry then the rest is too. This could be dumb.
      if (type(local, "array") && local[0] instanceof Entry) {
        local.map(entry(blog));
        continue;
      }

      // Proceed down the tree!
      if (type(local, "object") || type(local, "array")) {
        check(local, ++depth);
      }
    }
  }
  return locals;
};
