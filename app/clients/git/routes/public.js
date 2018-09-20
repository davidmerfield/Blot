
var pushover = require("pushover");
var repos = pushover(__dirname + "/data", { autoCreate: true });
var site = require("express").Router();
var auth = require("http-auth");
var sync = require("./sync");
var Blog = require("blog");

repos.on("push", function(push) {
  push.accept();

  push.response.once("finish", function() {
    sync(push.repo, function() {});
  });
});

site.use("/end", auth.connect(auth.basic({ realm: "Git" }, check)));

// We need to pause then resume for some
// strange reason. Read pushover's issue #30
site.use("/end", function(req, res) {
  req.pause();
  repos.handle(req, res);
  req.resume();
});

function check(handle, token, callback) {
  debug("Authenticating", handle, token);

  Blog.get({ handle: handle }, function(err, blog) {
    if (err || !blog) {
      debug("No blog with handle", handle);
      return callback(false);
    }

    database.check_token(blog.id, token, function(err, valid) {
      debug("Is token valid?", err === null && valid);
      callback(err === null && valid);
    });
  });
}

module.exports = site;