var getView = require("./getView");
var async = require("async");
var ensure = require("helper/ensure");

module.exports = function getPartials(blogID, templateID, partials, callback) {
  try {
    ensure(blogID, "string")
      .and(templateID, "string")
      .and(partials, "object")
      .and(callback, "function");
  } catch (e) {
    return callback(e);
  }

  var Entry = require("../entry");
  var allPartials = {};
  var retrieve = {};

  for (var i in partials) if (partials[i]) allPartials[i] = partials[i];

  fetchList(partials, function () {
    return callback(null, allPartials, retrieve);
  });

  function fetchList(partials, done) {
    async.eachOfSeries(
      partials,
      function (value, partial, next) {
        // Don't fetch a partial if we've got it already.
        // Partials which returned nothing are set as
        // empty strings to prevent any infinities.
        if (allPartials[partial] !== null && allPartials[partial] !== undefined)
          return next();

        // If the partial's name starts with a slash,
        // it is a path to an entry.
        if (partial.charAt(0) === "/") {
          Entry.get(blogID, partial, function (entry) {
            // empty string and not undefined to
            // prevent infinite fetches
            allPartials[partial] = "";

            if (!entry || !entry.html) return next();

            // Only allow access to entries which exist and are public
            if (!entry.deleted && !entry.draft && !entry.scheduled)
              allPartials[partial] = entry.html;

            next();
          });
        }

        // If the partial's name doesn't start with a slash,
        // it is the name of a tempalte view.
        if (partial.charAt(0) !== "/") {
          getView(templateID, partial, function (err, view) {
            if (view) {
              allPartials[partial] = view.content;

              for (var i in view.retrieve) retrieve[i] = view.retrieve[i];

              fetchList(view.partials, next);
            } else {
              allPartials[partial] = "";
              next();
            }
          });
        }
      },
      done
    );
  }
};
