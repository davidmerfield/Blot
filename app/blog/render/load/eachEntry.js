var async = require("async");
var type = require("helper/type");
var Entry = require("models/entry/instance");
var list = require("./list");

module.exports = function (locals, iterator, callback) {
  function modify(entry, next) {
    const queue = [iterator.bind(null, entry)];

    // Also augment adjacent entries...
    if (entry.next instanceof Entry)
      queue.push(iterator.bind(null, entry.next));

    if (entry.previous instanceof Entry)
      queue.push(iterator.bind(null, entry.previous));

    async.parallel(queue, next);
  }

  let entries = [];

  extractEntriesFromView(locals);

  async.each(entries, modify, callback);

  function extractEntriesFromView(obj, depth = 0) {
    for (var key in obj) {
      var local = obj[key];

      // Partials never contain an entry
      if (key === "partials" && depth === 0) {
        continue;
      }

      // This is an entry, modify it now and proceed!
      if (local instanceof Entry) {
        entries.push(local);
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
        for (var entry in local) {
          entries.push(local[entry]);
        }
        continue;
      }

      // Proceed down the tree!
      if (type(local, "object") || type(local, "array")) {
        extractEntriesFromView(local, ++depth);
      }
    }
  }
};
