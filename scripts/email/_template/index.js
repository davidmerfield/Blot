var send = require("../send");
var each = require("../../each/blog");
var users = [];

// Use this function to filter blogs based on
// whether or not we should email their owner.
function filter(user, blog, next) {
  // Add the user to the list of users to email
  // if the blog or user meets a certain condition
  if (blog.handle === "dev") users.push(user);

  next();
}

each(filter, function () {
  send(__dirname + "/email.txt", users, function (err) {
    if (err) throw err;
    process.exit();
  });
});
