var User = require("../../app/models/user");
var format = require("url").format;
var config = require("config");

if (require.main === module) {
  var email = process.argv[2];
  var subscription = {};
  var password = process.argv[3];

  if (password) {
    User.hashPassword(password, function(err, passwordHash) {
      if (err) throw err;

      User.create(email, passwordHash, subscription, function(err) {
        if (err) throw err;

        console.log("Created user", email);
        process.exit();
      });
    });
  } else {
    generateLink(email, function(err) {
      if (err) throw err;

      process.exit();
    });
  }
}

function generateLink(email, callback) {
  User.generateAccessToken(email, function(err, token) {
    if (err) throw err;

    // The full one-time log-in link to be sent to the user
    var url = format({
      protocol: "https",
      host: config.host,
      pathname: "/sign-up",
      query: {
        already_paid: token
      }
    });

    console.log("Use this link to create an account for:", email);
    console.log(url);
    callback();
  });
}

module.exports = generateLink;
