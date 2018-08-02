var Express = require("express");
var Account = new Express.Router();

Account.route("/").get(function(req, res) {
  res.render("account/index", {
    title: "Your account"
  });
});

Account.use("/password", require("./password"));
Account.use("/export", require("./export"));
Account.use("/email", require("./email"));
Account.use("/subscription", require("./subscription"));
Account.use("/switch-blog", require("./switch-blog"));
Account.use("/create-blog", require('./create-blog'));


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

Account.use(function(err, req, res, next){
  res.redirect(req.originalUrl, err);
});

// require("./close-blog")(server);
// require("./cancel")(server);
// require("./delete")(server);
// require("./pay-subscription")(server);
// require("./swap")(server);
// require("./update-billing")(server);

module.exports = Account;
