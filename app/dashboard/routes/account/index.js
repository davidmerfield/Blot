var formJSON = require("helper").formJSON;
var User = require("user");
var Express = require("express");
var Account = new Express.Router();

var Entries = require("entries");
var Template = require("template");
var helper = require("helper");
var forEach = helper.forEach.parallel;

Account.route("/").get(function(req, res) {
  res.render("account/index", {
    title: "Your account"
  });
});

Account.use("/password", require("./password"));
Account.use("/export", require("./export"));
Account.use("/subscription", require("./subscription"));

Account.route("/email")

  .get(function(req, res) {
    res.render("account/email", {
      title: "Change your email",
      subpage_title: "Email",
      subpage_slug: "email"
    });
  })

  .post(function(req, res) {
    var updates = formJSON(req.body, User.model);

    User.set(req.user.uid, updates, function(error, changes) {
      if (error) {
        res.message({ error: error.message });
        return res.redirect("/account/email");
      } else if (changes && changes.length) {
        res.message({ success: "Made changes successfully!", url: "/account" });
      }

      res.redirect("/account");
    });
  });

Account.route("/log-out")

  .get(function(req, res) {
    res.render("account/log-out", {
      title: "Log out"
    });
  })

  .post(function(req, res) {
    var redirect = (req.query && req.query.then) || "/";

    if (!req.session) return res.redirect(redirect);

    req.session.destroy(function() {
      res.clearCookie("connect.sid");
      res.redirect(redirect);
    });
  });

// require("./close-blog")(server);
// require("./create-blog")(server);
// require("./cancel")(server);
// require("./delete")(server);
// require("./pay-subscription")(server);
// require("./swap")(server);
// require("./update-billing")(server);

module.exports = Account;
