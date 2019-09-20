var Express = require("express");
var Email = new Express.Router();
var User = require("user");

Email.route("/")

  .get(function(req, res) {
    res.render("account/email", {
      title: "Change your email",
      breadcrumb: "Email"
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

      if (changes.length) {
        res.message("/account", "Saved your new email address");
      } else {
        res.redirect(req.baseUrl + req.path);
      }
    });
  });

module.exports = Email;
