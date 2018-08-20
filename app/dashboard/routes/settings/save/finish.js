var SUCCESS = "Made changes successfully!";
var resaveEntries = require("./resaveEntries");
var rebuild = require("../../../../rebuild");
var Blog = require("blog");
var _ = require("lodash");
var helper = require("helper");

module.exports = function(req, res, next) {
  var blog = req.blog;
  var blogID = blog.id;
  var updates = req.updates || {};
  var redirect = req.body.redirect || req.path;

  Blog.set(blogID, updates, function(errors, changes) {
    if (errors) return next(errors);


    // We now need to save every entry so that
    // changes to permalink format take effect.
    if (
      changes.indexOf("timeZone") > -1 ||
      changes.indexOf("dateDisplay") > -1 ||
      changes.indexOf("permalink") > -1
    ) {
      resaveEntries(blogID, function() {});
    }

    // We need to build all the blog's entries if the user
    // has changed any of the plugins or their permalink
    // format. This should be improved but we.
    if (changes && changes.indexOf("plugins") > -1) {
      rebuild(blog.id);
    }

    // Add success message if we're going to the settings page
    // and successful changes were made
    if (changes && changes.length && _.isEmpty(errors)) {
      return res.message(redirect, 'Saved changes to your ' + changes.join(','));
    }

    return res.redirect(redirect);
  });
};
