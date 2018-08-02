var Express = require("express");
var Email = new Express.Router();
var User = require("user");

Email.route("/")

  .get(function(req, res) {
    res.render("account/email", {
      title: "Change your email",
      subpage_title: "Email",
      subpage_slug: "email"
    });
  })

  .post(function(req, res, next) {
    if (!req.body.email) {
      return next(new Error("Please specify an email address"));
    }

    User.set(req.user.uid, { email: req.body.email }, function(err, changes) {
      if (err) {
        return next(err);
      }

      res.message("/account", "Made changes successfully!");
    });
  });

module.exports = Email;
