var send = require("../send");
var each = require("../../each/blog");

var emailFile = __dirname + "/email.txt";
var users = [];

each(
  function(user, blog, next) {

    users.push(user);
    next();
  },
  function() {
    send(emailFile, users, function(err) {
      if (err) throw err;
      process.exit();
    });
  }
);
