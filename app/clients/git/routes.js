var authenticate = require("./authenticate");
var create = require("./create");
var database = require("./database");
var disconnect = require("./disconnect");
var REPO_DIR = __dirname + "/data";
var pushover = require("pushover");
var sync = require("./sync");
var repos = pushover(REPO_DIR, { autoCreate: true });
var Express = require("express");
var dashboard = Express.Router();
var site = Express.Router();
var debug = require("debug")("clients:git:routes");

dashboard.get("/", function(req, res, next) {
  repos.exists(req.blog.handle + ".git", function(exists) {
    if (exists) return next();

    create(req.blog, next);
  });
});

dashboard.get("/", function(req, res) {
  database.getToken(req.blog.id, function(err, token) {
    res.render(__dirname + "/views/index.html", {
      title: "Git",
      token: token,
      host: process.env.BLOT_HOST
    });
  });
});

dashboard.get("/disconnect", function(req, res) {
  res.render(__dirname + "/views/disconnect.html", {
    title: "Git"
  });
});

dashboard.post("/refresh-token", function(req, res, next) {
  database.refreshToken(req.blog.id, function(err) {
    if (err) return next(err);

    res.redirect(req.baseUrl);
  });
});

dashboard.post("/disconnect", function(req, res, next) {
  disconnect(req.blog.id, next);
});

site.use("/end/:gitHandle.git", authenticate);

repos.on("push", function(push) {
  push.accept();
  push.response.on("finish", function() {
    sync(push.request.user, function(err) {
      if (err) {
        debug(err);
      } else {
        debug("Sync completed successfully!");
      }
    });
  });
});

// We need to pause then resume for some
// strange reason. Read pushover's issue #30
// For another strange reason, this doesn't work
// when I try and mount it at the same path as
// the authentication middleware, e.g:
// site.use("/end/:gitHandle.git", function(req, res) {
// I would feel more comfortable if I could.
site.use("/end", function(req, res) {
  req.pause();
  repos.handle(req, res);
  req.resume();
});

module.exports = { dashboard: dashboard, site: site };
