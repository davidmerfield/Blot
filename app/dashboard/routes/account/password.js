var Express = require("express");
var Password = new Express.Router();
var User = require("user");
var checkPassword = require("./util/checkPassword");

Password.route("/change")

  .all(requireExisting)

  .get(function(req, res) {
    res.render("account/change-password", {
      breadcrumb: "Password",
      title: "Change your password"
    });
  })

  .post(checkPassword, checkMatching, save);

Password.route("/set")

  .get(function(req, res) {

    if (req.query.token) {
      req.session.token = req.query.token;
      return res.redirect(req.baseUrl + req.path);
    }

    if (!req.session.token) {
      return res.redirect("/");
    }

    return res.render("account/set-password", {
      title: "Set your password",
      token: req.session.token
    });
  })

  .post(checkMatching, verifyToken, save)

function requireExisting(req, res, next) {
  if (req.user.hasPassword) {
    next();
  } else {
    res.redirect("/account/password/set");
  }
}

function save(req, res, next) {
  User.hashPassword(req.body.newPasswordA, function(err, passwordHash) {
    if (err) return next(err);

    if (!passwordHash) return next(new Error("Could not hash password"));

    User.set(req.user.uid, { passwordHash: passwordHash }, function(err) {
      if (err) return next(err);
      res.message("/account", "Saved your new password");
    });
  });
}

function checkMatching(req, res, next) {
  if (!req.body.newPasswordA) {
    return next(new Error("Please choose a new password"));
  }

  if (req.body.newPasswordA !== req.body.newPasswordB) {
    return next(new Error("Your new passwords do not match."));
  }

  next();
}

function verifyToken(req, res, next) {

  var token = req.session.token;

  delete req.session.token;
  
  User.checkAccessToken(token, function(err, tokenUid) {
    
    if (err) return next(err);

    if (tokenUid !== req.user.uid) {
      return next(new Error("Your token was invalid."));
    }

    next();
  });
}

module.exports = Password;
