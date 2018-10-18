var helper = require("helper");
var dirToModule = helper.dirToModule;
var dictionary = dirToModule(__dirname, require);
var async = require("async");
var Template = require("template");
var Entry = require("entry");

module.exports = function(req, viewID, callback) {
  var get = new Get(req.blog.id, req.template.id);

  Template.getView(req.template.id, viewID, function(err, view) {
    if (err) return callback(err);
    if (!view) return callback(new Error("No view"));

    async.eachOf(
      view.partials,
      function fetch(x, partialID, next) {
        // Don't fetch a partial if we've got it already.
        if (
          view.partials[partialID] !== null &&
          view.partials[partialID] !== undefined
        ) {
          return next();
        }

        get(partialID, function(err, partial) {
          if (err) return next(err);

          if (!partial) {
            view.partials[partialID] = "";
            return next();
          }

          view.partials[partialID] = partial.content;

          for (var i in partial.retrieve)
            view.retrieve[i] = partial.retrieve[i];

          async.eachOf(partial.partials, fetch, next);
        });
      },
      function(err) {
        if (err) return callback(err);

        async.mapValues(
          view.retrieve,
          function(value, variable, next) {
            if (dictionary[variable] === undefined) {
              return next();
            }

            dictionary[variable](req, next);
          },
          function(err) {
            Object.assign(view.locals, view.retrieve);
            callback(err, view);
          }
        );
      }
    );
  });
};

function Get(blogID, templateID) {
  return function(partialID, callback) {
    Entry.get(blogID, partialID, function(entry) {
      if (entry && !entry.deleted && entry.html) {
        return callback(null, {
          content: entry.html,
          partials: {},
          retrieve: {}
        });
      }

      Template.getView(templateID, partialID, callback);
    });
  };
}
