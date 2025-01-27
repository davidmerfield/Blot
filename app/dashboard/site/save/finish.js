var resaveEntries = require("models/entries").resave;
var build = require("build");
var Blog = require("models/blog");
var Entries = require("models/entries");
var Entry = require("models/entry");
var _ = require("lodash");
var basename = require("path").basename;
var rebuild = require("sync/rebuild");

var dictionary = {
  permalink: "Saved changes to your link format",
  forceSSL: "Saved SSL redirect setting",
  roundAvatar: "Saved photo settings",
  avatar: "Saved changes to your photo",
  menu: "Saved changes to your links",
  dateFormat: "Saved changes to the order in which you write your dates",
};

module.exports = function (req, res, next) {
  var updates = req.updates || {};
  var redirect = req.body.redirect || req.path;

  Blog.set(req.blog.id, updates, function (errors, changes) {
    if (errors)
      for (var i in errors)
        if (errors[i] instanceof Error) return next(errors[i]);

    if (errors) return next(errors);

    // We now need to save every entry so that
    // changes to permalink format take effect.
    if (changes.indexOf("permalink") > -1) {
      resaveEntries(req.blog.id, function () {});
    }

    // We need to build all the blog's entries if the user
    // has changed any of the plugins or their permalink
    // format. This should be improved but we.
    if (changes && changes.indexOf("plugins") > -1) {
      // we need to fetch the latest version of the blog to rebuild
      const options = {
        thumbnails: false, // do not re-generate thumbnails
        imageCache: false, // do not re-cache images in posts
      };
      rebuild(req.blog.id, options, function () {});
    }

    // Add success message if we're going to the settings page
    // and successful changes were made
    if (changes && changes.length && _.isEmpty(errors)) {

      return res.message(
        redirect,
        dictionary[changes[0]] || "Saved changes to your " + changes[0]
      );
    }

    return res.redirect(redirect);
  });
};
