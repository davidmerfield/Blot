var Blog = require("blog");
// We pass an empty string to handle validator
// since we don't know the ID of the blog yet
var validate = require("./validate");
var calculate = require("./calculate");
var fs = require("fs-extra");
var charge = require("./charge");
var helper = require("helper");
var localPath = helper.localPath;
var pretty = helper.prettyPrice;
var badSubscription = require("./badSubscription");
var config = require("config");
var INACTIVE = "You need an active subscription to create another blog.";

module.exports = function(server) {
  server
    .route("/account/create-blog")

    .get(function(req, res) {
      var user = req.user;
      var subscription = user.subscription;
      var first_blog = user.blogs.length === 0 && user.subscription.quantity === 1;
      var fee = calculate(subscription);

      if (
        user.blogs.length &&
        badSubscription(subscription) &&
        user.uid !== config.admin.uid
      ) {
        res.message({ error: INACTIVE, url: "/account" });
        return res.redirect("/account");
      }

      res.render("account/create-blog", {
        now: pretty(fee.now),
        title: "Create a blog",
        create: true,
        subpage_slug: 'create-blog',
        subpage_title: 'Create a blog',
        first_blog: first_blog,
        later: pretty(fee.later),
        individual: pretty(fee.individual)
      });
    })

    .post(validate, charge, function(req, res, next) {
      var user = req.user;
      var uid = user.uid;

      var newBlog = {
        handle: req.body.handle,
        timeZone: req.body.timeZone
      };

      Blog.create(uid, newBlog, function(err, newBlog) {
        if (err) return next(err);

        // Switch to the new blog
        req.session.blogID = newBlog.id;

        fs.emptyDir(localPath(newBlog.id, "/"), function(err) {
          if (err) return next(err);

          res.redirect("/folder/connect");
        });
      });
    })

    // Handle errors..
    .all(function(err, req, res, next) {
      var message;

      try {
        console.log(err);

        if (err.trace) console.log(err.trace);
        if (err.stack) console.log(err.stack);

        if (err.message) {
          message = err.message;
        } else {
          message = err;
        }

        res.message({ error: message });
        res.redirect(req.route.path);
      } catch (e) {
        return next(e);
      }
    });
};
