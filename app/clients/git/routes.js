var pushover = require("pushover");
var dashboard = require("express").Router();
var fs = require("fs-extra");
var Blog = require("blog");
var REPO_DIR = __dirname + "/data";
var repos = pushover(REPO_DIR, { autoCreate: true });
var helper = require("helper");
var Git = require("simple-git/promise");
var debug = require("debug")("client:git:dashboard");
var UID = helper.makeUid;
var join = require("path").join;
var database = require("./database");
var client = require("./client");
var config = require("config");

function blog_dir(blog_id) {
  return join(config.blog_folder_dir, blog_id);
}

dashboard.use(function(req, res, next) {
  res.dashboard = function(name) {
    res.render(__dirname + "/views/" + name + ".html", {
      title: "Git",
      subpage_title: "Folder"
    });
  };

  res.locals.host = process.env.BLOT_HOST;

  next();
});

dashboard.get("/", function(req, res, next) {
  if (!req.blog.client) return res.redirect("/clients");

  repos.exists(req.blog.handle + ".git", function(exists) {
    if (!exists) return create(req, res, next);

    database.get_token(req.blog.id, function(err, token) {
      res.locals.token = token;
      res.dashboard("index");
    });
  });
});

function create(req, res, next) {
  var blog_folder = blog_dir(req.blog.id);
  var tmp_folder = helper.tempDir() + "/git-" + helper.guid() + req.blog.id;
  var bare_repo_path = REPO_DIR + "/" + req.blog.handle + ".git";
  var bare_git_repo;
  var git_repo_in_blog_folder;
  var placeholder_path = join(blog_folder, "placeholder-" + UID(16) + ".txt");

  fs.stat(blog_folder + "/.git", function(err, stat) {
    if (stat && !err) {
      return next(
        new Error(
          "There is already a git repository in your blogs folder, please remove it"
        )
      );
    }

    if (err && err.code !== "ENOENT") {
      return next(err);
    }

    database.refresh_token(req.blog.id, function(err) {
      if (err) return next(err);

      repos.create(req.blog.handle, function(err) {
        if (err) return next(err);

        bare_git_repo = Git(REPO_DIR + "/" + req.blog.handle + ".git");
        // start_listener(req.blog.handle);

        fs.copy(blog_folder, tmp_folder)
          .then(function() {
            debug(req.blog.id, "Emptying blog folder");
            return fs.emptyDir(blog_folder);
          })
          .then(function() {
            debug(req.blog.id, "Cloning bare repository");
            return bare_git_repo.clone(bare_repo_path, blog_folder);
          })
          .then(function() {
            debug(req.blog.id, "Copying tmp folder");
            return fs.copy(tmp_folder, blog_folder);
          })
          .then(function() {
            git_repo_in_blog_folder = Git(blog_folder);
            debug(req.blog.id, "Removing tmp folder");
            return fs.remove(tmp_folder);
          })
          .then(function() {
            debug(req.blog.id, "Writing placeholder");
            return fs.outputFile(placeholder_path, "", "utf-8");
          })
          .then(function() {
            debug(req.blog.id, "Adding placeholder to checked out repo");
            return git_repo_in_blog_folder.add("./*");
          })
          .then(function() {
            debug(req.blog.id, "Commiting placeholder in checked out repo");
            return git_repo_in_blog_folder.commit(["-m", "Initial commit"]);
          })
          .then(function() {
            debug(req.blog.id, "Removing placeholder");
            return fs.remove(placeholder_path);
          })
          .then(function() {
            debug(req.blog.id, "Adding removed placeholder to index");
            return git_repo_in_blog_folder.add("./*");
          })
          .then(function() {
            debug(req.blog.id, "Commiting removed placeholder");
            return git_repo_in_blog_folder.commit([
              "-m",
              "Removed placeholder file"
            ]);
          })
          .then(function() {
            debug(req.blog.id, "Pushing initial commits");
            return git_repo_in_blog_folder.push(["-u", "origin", "master"]);
          })
          .then(function() {
            debug(req.blog.id, "Redirecting to", req.baseUrl);
            res.redirect(req.baseUrl);
          })
          .catch(function(err) {
            next(err);
          });
      });
    });
  });
}

dashboard.post("/refresh_token", function(req, res, next) {
  database.refresh_token(req.blog.id, function(err) {
    if (err) return next(err);

    res.redirect(req.baseUrl);
  });
});

dashboard.post("/disconnect", function(req, res, next) {
  client.disconnect(req.blog.id, function(err) {
    if (err) return next(err);

    res.redirect("/clients");
  });
});

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

module.exports = { site: site, dashboard: dashboard };

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
