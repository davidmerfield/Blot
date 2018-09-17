var Express = require("express");
var Account = new Express.Router();
var logout = require('./util/logout');
var type = require('helper').type;

Account.route("/").get(function(req, res) {
  res.render("account/index", {
    title: "Your account"
  });
});

Account.use("/password", require("./password"));
Account.use("/export", require("./export"));
Account.use("/email", require("./email"));
Account.use("/delete", require("./delete"));
Account.use("/subscription", require("./subscription"));
Account.use("/switch-blog", require("./switch-blog"));
Account.use("/create-blog", require('./create-blog'));
Account.use("/pay-subscription", require('./pay-subscription'));
Account.use("/payment-method", require('./payment-method'));


Account.route("/log-out")

  .get(function(req, res) {
    res.render("account/log-out", {
      title: "Log out"
    });
  })

  .post(logout, function(req, res) {
    
    var redirect = (req.query && req.query.then) || "/logged-out";
    
    res.redirect(redirect);
  });

Account.use(function(err, req, res, next){

  // console.log('here', req.method, req.header('referrer'), req.originalUrl, typeof err, err instanceof Error, err.message);
  
  if (req.method === 'GET') {
    console.log(err.stack, err.trace);
    res.status(500);
    res.render('error', {error: err});
  } else if (req.method === 'POST') {
    
    var redirect = req.body.redirect || req.baseUrl + req.path;
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

// require("./pay-subscription")(server);

module.exports = Account;
