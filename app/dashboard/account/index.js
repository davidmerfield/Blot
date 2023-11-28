var Express = require("express");
var Account = new Express.Router();
var logout = require("./util/logout");
const type = require("helper/type");
const stripe = require("./stripe");
const paypal = require("./paypal");

Account.use(function (req, res, next) {
  res.locals.breadcrumbs.add("Your account", "/account");
  res.locals.account = true;
  next();
});

Account.use(stripe.load);
Account.use(paypal.load);

Account.route("/").get(function (req, res) {
  res.redirect("/dashboard");
});

Account.use("/:section", function (req, res, next) {
  var uppercaseName = req.params.section;

  uppercaseName = uppercaseName[0].toUpperCase() + uppercaseName.slice(1);
  uppercaseName = uppercaseName.split("-").join(" ");

  res.locals.breadcrumbs.add(uppercaseName, req.params.section);
  next();
});

Account.use("/:section/:subsection", function (req, res, next) {
  var uppercaseName = req.params.subsection;

  uppercaseName = uppercaseName[0].toUpperCase() + uppercaseName.slice(1);
  uppercaseName = uppercaseName.split("-").join(" ");

  res.locals.breadcrumbs.add(uppercaseName, req.params.subsection);
  next();
});

Account.use("/password", require("./password"));
Account.use("/export", require("./export"));
Account.use("/email", require("./email"));
Account.use("/create-blog", require("./create-blog"));
Account.use("/subscription", require("./subscription"));
Account.use("/pay-subscription", require("./pay-subscription"));

Account.post("/log-out", logout, function (req, res) {
  res.redirect("/log-in?out=true");
});

Account.use(function (err, req, res, next) {
  if (req.method === "GET") {
    console.log(err, err.trace);
    res.status(500);
    res.render("error", { error: err });
  } else if (req.method === "POST") {
    var redirect = (req.body && req.body.redirect) || req.baseUrl + req.path;
    var message = "Error";

    // this should not be an object but I made
    // some bad decisions in the past. eventually
    // fix blog.set...
    if (err.message) {
      message = err.message;
    }

    if (type(err, "object"))
      for (var i in err) if (type(err[i], "string")) message = err[i];

    res.message(redirect, new Error(message));
  } else {
    next(err);
  }
});

module.exports = Account;
