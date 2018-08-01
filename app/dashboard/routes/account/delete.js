var helper = require("helper");
var forEach = helper.forEach;
var localPath = helper.localPath;
var Blog = require("blog");
var User = require("user");
var emptyS3Folder = require("../../../upload/removeFolder");
var config = require("config");
var stripe = require("stripe")(config.stripe.secret);
var clients = require("clients");
var fs = require("fs-extra");

module.exports = function(server) {
  function removeBlog(blogID, nextBlog) {
    Blog.get({ id: blogID }, function(err, blog) {
      if (err) console.log(err);

      var remove_client;

      if (blog.client && clients[blog.client].disconnect) {
        remove_client = clients[blog.client].disconnect;
      } else {
        remove_client = function(x, y) {
          y();
        };
      }

      remove_client(blogID, function(err) {
        if (err) console.log(err);

        Blog.remove(blogID, function(err) {
          if (err) console.log(err);

          fs.remove(localPath(blogID, "/"), function(err) {
            if (err) console.log(err);

            nextBlog();

            emptyS3Folder(blogID, function(err) {
              if (err) console.log(err);
            });
          });
        });
      });
    });
  }

  server
    .route("/account/delete")

    .get(function(req, res) {
      res.locals.title = "Delete your account";
      res.locals.subpage_title = "Delete";
      res.locals.subpage_slug = "delete";
      res.render("account/delete");
    })

    .post(function(req, res, next) {
      forEach.parallel(req.user.blogs, removeBlog, next);
    })

    .post(function(req, res, next) {
      var customerID = req.user.subscription.customer;

      if (!customerID) return next();

      stripe.customers.del(customerID, function(err) {
        if (err) return next(err);
      });
    })

    .post(function(req, res, next) {
      User.remove(req.user.uid, function(err) {
        if (err) return next(err);
        res.redirect("/deleted");
      });
    });
};
