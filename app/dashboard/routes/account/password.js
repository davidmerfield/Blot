var Express = require("express");
var Password = new Express.Router();
var User = require("user");

Password.route("/change")

  .all(requireExisting)

  .get(function(req, res) {
    res.render("account/change-password", {
      subpage_title: "Password",
      subpage_slug: "change-password",
      title: "Change your password"
    });
  })

  .post(verifyCurrent, checkMatching, save);

Password.route("/set")

  .get(function(req, res) {

    if (!req.query.token) return res.redirect("/");

    return res.render("account/set-password", {
      title: "Set your password",
      token: req.query.token
    });
  })

  .post(verifyToken, checkMatching, save);


function requireExisting(req, res, next) {
  if (req.user.hasPassword) {
    next();
  } else {
    res.redirect("/account/set-password");
  }
}

function save(req, res, next) {
  User.hashPassword(req.body.newPasswordA, function(err, passwordHash) {
    if (err) return next(err);

    if (!passwordHash) return next(new Error("Could not hash password"));

    User.set(req.user.uid, { passwordHash: passwordHash }, function(err) {
      if (err) return next(err);
      res.message({
        success: "Changed password successfully!",
        url: "/account"
      });
      res.redirect("/account");
    });
  });
}

function verifyCurrent(req, res, next) {
  User.checkPassword(req.user.uid, req.body.currentPassword, function(
    err,
    match
  ) {
    if (err) return next(err);

    if (!match) {
      return next(new Error("Your existing password is incorrect."));
    }

    next();
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
  User.checkAccessToken(req.body.token, function(err, tokenUid) {
    if (err) return next(err);

    if (tokenUid !== req.user.uid) {
      return next(new Error("Your token was invalid."));
    }

    next();
  });
}

module.exports = Password;
