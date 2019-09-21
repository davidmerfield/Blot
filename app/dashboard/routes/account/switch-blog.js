var Express = require("express");
var SwitchBlog = new Express.Router();
var User = require("user");

SwitchBlog.route("/")
.post(function(req, res, next) {
  if (!req.body.to) {
    return next(new Error("Please specify a blog"));
  }

  // Verify the user owns the blog
  if (req.user.blogs.indexOf(req.body.to) === -1) {
    return next(new Error("You do not have access to that blog"));
  }

  User.set(req.user.uid, { lastSession: req.body.to }, function(err) {
    if (err) return next(err);
    req.session.blogID = req.body.to;

    res.redirect("/settings");
  });
});

module.exports = SwitchBlog;
