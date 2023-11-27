var getView = require("./getView");
var ensure = require("helper/ensure");
var extend = require("helper/extend");
var getPartials = require("./getPartials");
var mime = require("mime-types");

// This method is used to retrieve the locals,
// partials and missing locals for a given view.
module.exports = function getFullView(blogID, templateID, viewName, callback) {
  ensure(blogID, "string")
    .and(templateID, "string")
    .and(viewName, "string")
    .and(callback, "function");

  getView(templateID, viewName, function (err, view) {
    if (err || !view) return callback(err);

    // View has:

    // - content (string) of the template view
    // - retrieve (object) locals embedded in the view
    //                     which need to be fetched.
    // - partials (object) partials in view

    getPartials(blogID, templateID, view.partials, function (
      err,
      allPartials,
      retrieveFromPartials
    ) {
      if (err) return callback(err);

      // allPartials (object) viewname : viewcontent

      // Now we've fetched the partials we need to
      // append the missing locals in the partials...
      extend(view.retrieve).and(retrieveFromPartials);

      var response = [
        view.locals,
        allPartials,
        view.retrieve,
        view.type || mime.lookup(view.name) || "text/html",
        view.content,
      ];

      return callback(null, response);
    });
  });
};
