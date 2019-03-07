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

  .all(requireToken)

  .get(function(req, res) {
    res.render("account/set-password", {
      title: "Set your password"
    });
  })

  // We check whether the passwords match
  // before verifying the token because token
  // verification can only happen once and the
  // user might make a mistake typing their
  // password twice or submitting an empty form.
  .post(checkMatching, verifyToken, save);

function requireExisting(req, res, next) {
  if (req.user.hasPassword) {
    next();
  } else {
    res.redirect("/account/password/set");
  }
}

function requireToken(req, res, next) {
  if (!req.session.passwordSetToken) {
    return res.redirect("/");
  }

  next();
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
  var token = req.session.passwordSetToken;

  delete req.session.passwordSetToken;

  User.checkAccessToken(token, function(err, tokenUid) {
    if (err) return next(err);

    if (tokenUid !== req.user.uid) {
      return next(new Error("Your token was invalid."));
    }

    next();
  });
}

module.exports = Password;
