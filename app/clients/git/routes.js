var authenticate = require("./authenticate");
var create = require("./create");
var database = require("./database");
var disconnect = require("./disconnect");
var REPO_DIR = __dirname + "/data";
var pushover = require("pushover");
var sync = require("./sync");
var repos = pushover(REPO_DIR, { autoCreate: true });
var Express = require("express");
var gitEmit = require("git-emit-node7");
var dashboard = Express.Router();
var site = Express.Router();

dashboard.get("/", function(req, res, next) {
  repos.exists(req.blog.handle + ".git", function(exists) {
    if (exists) return next();

    create(req.blog, next);
  });
});

dashboard.get("/", function(req, res) {
  database.get_token(req.blog.id, function(err, token) {
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

dashboard.post("/refresh_token", function(req, res, next) {
  database.refresh_token(req.blog.id, function(err) {
    if (err) return next(err);

    res.redirect(req.baseUrl);
  });
});

dashboard.post("/disconnect", function(req, res, next) {
  disconnect(req.blog.id, next);
});

site.use("/end/:gitHandle.git", authenticate);

site.use("/end/:gitHandle.git", function(req, res, next) {
  var emitter;
  var handle = req.params.gitHandle;
  var bareRepoDir = __dirname + "/data/" + req.params.gitHandle + ".git";

  if (req.path !== '/git-receive-pack'){
    return next();
  } 
  
  emitter = gitEmit(bareRepoDir, function(err) {
    if (err) {
      console.log("ERROR STARTING LISTENER", err);
      // return next(err);
    } else {
      console.log("started emitter", req.path);
    }

    next();
  });

  emitter.on('error', function(err){
    console.log('emitter error', err);
  });

  emitter.on("post-receive", function(e) {
  
    console.log('closing emitter');
    emitter.close();
    console.log('closed emitter');

    sync(handle, function(err) {
      if (err) {
        console.log(err);
        console.log(err.trace);
      } else {
        console.log("Sync finished successfully!");
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
