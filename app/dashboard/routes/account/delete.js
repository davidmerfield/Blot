var Express = require("express");
var Delete = new Express.Router();
var User = require("user");

var checkPassword = require('./util/checkPassword');
var async = require('async');

var helper = require("helper");
var forEach = helper.forEach;
var localPath = helper.localPath;
var Blog = require("blog");
var pretty = require("helper").prettyPrice;

var User = require("user");
var removeFolder = require("../../../upload/removeFolder");
var config = require("config");
var stripe = require("stripe")(config.stripe.secret);
var clients = require("clients");
var fs = require("fs-extra");


Delete.route("/blog/:handle")

  // Verify the blog to be closed is owned
  // by the current user and load it into locals.
  // Work out how much we need to change the subscription
  // by after the blog has been deleted.
  .all(loadBlogToDelete, calculateSubscriptionChange)

  .get(function(req, res) {
    res.locals.title = "Delete " + req.blogToDelete.title;
    res.locals.subpage_title = "Delete blog";
    res.locals.subpage_slug = "close-blog";
    res.render("account/delete-blog", { host: process.env.BLOT_HOST });
  })

  // Save any changes to the user's subscription
  // then remove the blogID from the list of blogs
  // owned by the user.
  // Finally delete contents of the blog's folder on s3
  // which contains cached images/avatars. Also delete
  // the contents blog's folder on the server.
  // Delete the credentials used to sync the blog's folder
  .post(checkPassword, function (req, res, next) {
    deleteBlog(req.blogToDelete.id, next);
  }, decreaseSubscription);


function loadBlogToDelete (req, res, next) {

  Blog.get({ handle: req.params.handle }, function(err, blog) {
    
    if (err) {
      return next(err);
    }

    if (blog.owner !== req.user.uid) {
      return next(new Error('You do not have permission to delete this blog'));
    }

    req.blogToDelete = blog;
    res.locals.blogToDelete = blog;

    next();
  });
}

function calculateSubscriptionChange (req, res, next) {

  if (req.user.subscription.plan && req.user.subscription.plan.amount) {
    res.locals.reduction = pretty(req.user.subscription.plan.amount);  
  }
  
  return next();
}

Delete.route("/")

  .get(function(req, res) {
    res.render("account/delete", {
      title: "Delete your account",
      subpage_title: "Delete",
      subpage_slug: "delete"
    });
  })

  .post(checkPassword, deleteBlogs, deleteUser);




function deleteBlog (blogID, callback) {

  Blog.get({id: blogID}, function(err, blog){

    if (err) return callback(err);

    // All of these functions take the blogID as
    // first argument and callback as second.
    var queue = [
      removeFolder, 
      function(blogID, done){
        fs.emptyDir(localPath(blogID, ""), done);
      }, 
      Blog.remove, 
      updateUser
    ];

    if (blog.client) {
      queue.push(clients[blog.client].disconnect);
    }
      
    async.applyEach(queue, blog.id, callback);
  });
}

function deleteBlogs (req, res, next) {

    async.queue(deleteBlog(blog.id), function(err, res){
      next();
    });

  }

function deleteUser() {
  async.queue([
    removeStripeCustomer,
    removeUser,
  ], next);
}

function updateUser(blogID, callback) {
  
  var blogToClose = req.blogToClose;
  var blogs = req.user.blogs.slice();

  blogs = blogs.filter(function(blogID) {
    return blogID !== blogToClose.id;
  });

  User.set(req.user.uid, { blogs: blogs }, function(err) {
    if (err) return next(err);

    req.session.blogID = blogs.pop() || "";
    next();
  });
}





function decreaseSubscription(req, res, next) {
  var subscription = req.user.subscription;
  var quantity = req.user.blogs.length - 1;

  // The user does not have an active subscription
  // so proceed to the next middleware
  if (!subscription || !subscription.status || subscription.status !== "active")
    return next();

  console.log("Setting subscription quantity to", quantity);

  stripe.customers.updateSubscription(
    subscription.customer,
    subscription.id,
    { quantity: quantity, prorate: false },
    function(err, subscription) {
      if (err) return next(err);

      if (!subscription) return next(new Error("No subscription"));

      User.set(req.user.uid, { subscription: subscription }, function(err) {
        if (err) return next(err);

        next();
      });
    }
  );
}




function removeUser(req, res, next) {
  User.remove(req.user.uid, function(err) {
    if (err) return next(err);
    res.redirect("/deleted");
  });
}

function removeStripeCustomer(req, res, next) {
  var customerID = req.user.subscription.customer;

  if (!customerID) return next();

  stripe.customers.del(customerID, function(err) {
    if (err) return next(err);
  });
}

function removeBlogs(req, res, next) {
  forEach.parallel(req.user.blogs, removeBlog, next);
}

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

module.exports = Delete;
