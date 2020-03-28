require('../only_locally');

var config = require("config");
var Blog = require("blog");
var async = require("async");
var fs = require("fs-extra");
var join = require("path").join;
var os = require("os");
var User = require("user");
var colors = require("colors/safe");
var exec = require("child_process").exec;

var access = require("../access");
var getFolder = require("../../app/clients/dropbox/database").get;
var getToken = require("../../app/clients/git/database").getToken;
var clients = require("../../app/clients");

var ROOT = process.env.BLOT_DIRECTORY;
var BLOG_FOLDERS_DIRECTORY = ROOT + "/blogs";
var TMP_DIRECTORY = ROOT + "/tmp";

// This function lists all the blogs for a particular
// application state and then prints useful information
module.exports = function(callback) {
  Blog.getAllIDs(function(err, ids) {
    if (err) return callback(err);

    if (ids && ids.length > 10) {
      console.log("Too many blogs to log in");
      return callback();
    }

    async.eachSeries(
      ids,
      function(id, next) {
        Blog.get({ id: id }, function(err, blog) {
          if (err) return next(err);

          access(blog.handle, function(err, url) {
            if (err) return next(err);

            setupFolder(blog, function(err, folder) {
              console.log();
              console.log(colors.yellow(blog.title || blog.handle), "-", colors.dim(blog.id));
              console.log("Dashboard:", url);
              console.log("Blog:", "http://" + blog.handle + "." + config.host);
              if (folder) console.log("Folder:", folder);
              next();
            });
          });
        });
      },
      callback
    );
  });
};

function setupFolder(blog, callback) {
  if (blog.client === "dropbox") {
    setupDropbox(blog, callback);
  } else if (blog.client === "local") {
    setupLocal(blog, callback);
  } else if (blog.client === "git") {
    setupGit(blog, callback);
  } else {
    console.log(blog.handle, "uses unknown client");
    callback(null);
  }
}

function setupDropbox(blog, callback) {
  var folder;

  getFolder(blog.id, function(err, account) {
    if (account.full_access && account.folder && account.folder !== "/") {
      folder = join(os.homedir(), "Dropbox", account.folder);
    } else {
      folder = join(os.homedir(), "Dropbox", "Apps", "Blot test");
    }

    fs.emptyDirSync(folder);
    fs.copySync(BLOG_FOLDERS_DIRECTORY + "/" + blog.id, folder);
    callback(null, folder);
  });
}

function setupGit(blog, callback) {
  User.getById(blog.owner, function(err, user) {
    getToken(blog.owner, function(err, token) {
      var folder = TMP_DIRECTORY + "/git-" + Date.now() + "-" + blog.handle;
      var email = encodeURIComponent(user.email);
      var protocol = "https://" + email + ":" + token + "@";
      var route = "/clients/git/end/" + blog.handle + ".git";
      var endpoint = protocol + config.host + route;
      var git = "git clone " + endpoint + " " + folder;

      fs.emptyDirSync(TMP_DIRECTORY);
      exec(git, { silent: true }, function(err) {
        if (err) return callback(err);
        callback(null, folder);
      });
    });
  });
}

function setupLocal(blog, callback) {

  var folder = TMP_DIRECTORY + "/local-" + Date.now() + "-" + blog.handle;

  fs.emptyDirSync(TMP_DIRECTORY);
  fs.copySync(BLOG_FOLDERS_DIRECTORY + "/" + blog.id, folder);
  fs.ensureDirSync(folder);

  clients.local.setup(blog.id, folder, function(err) {
    
    if (err) return callback(err);
    callback(null, folder);
  });
}
