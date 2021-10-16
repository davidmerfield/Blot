var User = require("user");
var get = require("../get/blog");
var identifier = process.argv[2];

if (!identifier) throw "Please pass the user's email as an argument.";

User.getByEmail(identifier, function (err, user) {
  if (err || !user) throw err || new Error("No user");

  User.set(user.uid, { passwordHash: "" }, function (err) {
    if (err) throw err;

    process.exit();
  });
});
