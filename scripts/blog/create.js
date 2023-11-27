var colors = require("colors/safe");
var yesno = require("yesno");
var Blog = require("blog");
var User = require("user");
var validate = require("models/blog/validate/handle");
var access = require("../access");

if (require.main === module) {
  main(process.argv[2], process.argv[3], function (err) {
    if (err) {
      console.error(colors.red("Error:", err.message));
      return process.exit(1);
    }

    process.exit();
  });
}

function main(email, handle, callback) {
  if (!email) {
    return callback(
      new Error("Pass email of user to add new blog to as first argument")
    );
  }

  if (!handle) {
    return callback(new Error("Pass handle for new blog as second argument"));
  }

  validate("", handle, function (err, handle) {
    if (err) return callback(err);

    User.getByEmail(email, function (err, user) {
      if (err || !user) {
        return callback(
          new Error("No user with email " + colors.underline(email))
        );
      }

      var message =
        colors.dim("Email: ") +
        user.email +
        colors.dim("\nUser ID: ") +
        user.uid +
        colors.dim("\nHandle: ") +
        handle +
        "\n\nCreate blog " +
        colors.bold(handle) +
        "? (y/N)";

      yesno.ask(message, false, function (ok) {
        if (!ok) return callback(new Error("User was not created"));
        Blog.create(user.uid, { handle: handle }, function (err) {
          if (err) return callback(err);

          access(handle, function (err, url) {
            if (err) return callback(err);

            console.log(
              colors.green("Added new blog", handle, "to", email, ":")
            );
            console.log(url);
            callback(null);
          });
        });
      });
    });
  });
}

module.exports = main;
