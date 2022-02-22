var User = require("models/user");
var format = require("url").format;
var config = require("config");

if (require.main === module) {
  var email = process.argv[2];
  var subscription = {};
  var password = process.argv[3];

  if (password) {
    User.hashPassword(password, function (err, passwordHash) {
      if (err) throw err;

      User.create(email, passwordHash, subscription, function (err) {
        if (err) throw err;

        console.log("Created user", email);
        process.exit();
      });
    });
  } else {
    generateLink(email, function (err) {
      if (err) throw err;

      process.exit();
    });
  }
}

function generateLink(email, callback) {
  const expires = 60 * 60 * 24 * 180; // 180 days time
  User.generateAccessToken({ expires }, function (err, token) {
    if (err) throw err;

    // The full one-time log-in link to be sent to the user
    var url = format({
      protocol: "https",
      host: config.host,
      pathname: `/sign-up/paid/${token}`,
    });

    console.log("Use this link to create an account");
    console.log(url);

    console.log();
    console.log(
      `The link will expire ${require("moment")()
        .add(expires, "seconds")
        .fromNow()}`
    );

    callback();
  });
}

module.exports = generateLink;
