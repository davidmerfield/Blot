var Template = require("template");
var async = require("async");

 Template.view.get(templateID, name, { partials: true }, function(
      err,
      view
    ) {
      if (err || !view) return next(err);


async.eachOf(
        view.partials,
        function(i, partial, next) {
          Entry.get(blogID, partial, function(entry) {
            if (
              !entry ||
              !entry.html ||
              entry.deleted ||
              entry.draft ||
              entry.scheduled
            ) {
              view.partials[partial] = "";
            } else {
              view.partials[partial] = entry.html;
            }
            next();
          });
        },
        function(err) {

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

        get(templateID, partialID, function(err, partialView) {
          if (err) return next(err);

          if (!partialView) {
            view.partials[viewID] = "";
            return next();
          }

          view.partials[viewID] = partialView.content;
          for (var i in partialView.retrieve)
            view.retrieve[i] = partialView.retrieve[i];

          async.each(partialView.partials, fetch, next);
        });
      },
      function(err) {
        callback(err, view);
      }
    );