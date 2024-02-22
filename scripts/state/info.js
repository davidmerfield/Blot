require("../only_locally");

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
var getFolder = require("clients/dropbox/database").get;
var getToken = require("clients/git/database").getToken;
var localPath = require("helper/localPath");

var ROOT = process.env.BLOT_DIRECTORY;
var BLOG_FOLDERS_DIRECTORY = ROOT + "/blogs";
var TMP_DIRECTORY = ROOT + "/tmp";

// This function lists all the blogs for a particular
// application state and then prints useful information
module.exports = function (callback) {
  return callback(null, "This function is not implemented");

  var client = require("redis").createClient();

  Blog.getAllIDs(function (err, ids) {
    if (err) return callback(err);

    let res = "";

    if (ids && ids.length > 10) {
      res += colors.red("Too many blogs to log in");
      return callback(null, res);
    }

    async.eachSeries(
      ids,
      function (id, next) {
        Blog.get({ id: id }, function (err, blog) {
          if (err) return next(err);

          access(blog.handle, function (err, url) {
            if (err) return next(err);

            setupFolder(client, blog, function (err, folder) {
              res += `
${colors.yellow(blog.title || blog.handle)}  - ${colors.dim(blog.id)}
Dashboard: ${url}
Blog: http://${blog.handle}.${config.host}
${folder ? "Folder: " + folder : ""}
`;
              next();
            });
          });
        });
      },
      function (err) {
        if (err) return callback(err, res);
        // Signal to the process in app/templates/index to rebuild
        // any templates since they might be out of date in this state
        client.publish("templates:rebuild", "Go!", function (err) {
          callback(err, res);
        });
      }
    );
  });
};

function setupFolder (client, blog, callback) {
  if (blog.client === "dropbox") {
    setupDropbox(blog, callback);
  } else if (blog.client === "local") {
    setupLocal(client, blog, callback);
  } else if (blog.client === "git") {
    setupGit(blog, callback);
  } else {
    console.log(blog.handle, "uses unknown client");
    callback(null);
  }
}

function setupDropbox (blog, callback) {
  var folder;

  getFolder(blog.id, function (err, account) {
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

function setupGit (blog, callback) {
  User.getById(blog.owner, function (err, user) {
    getToken(blog.owner, function (err, token) {
      var folder = TMP_DIRECTORY + "/git-" + Date.now() + "-" + blog.handle;
      var email = encodeURIComponent(user.email);
      var protocol = "https://" + email + ":" + token + "@";
      var route = "/clients/git/end/" + blog.handle + ".git";
      var endpoint = protocol + config.host + route;
      var git = "git clone " + endpoint + " " + folder;

      fs.emptyDirSync(TMP_DIRECTORY);
      exec(git, { silent: true }, function (err) {
        if (err) return callback(err);
        callback(null, folder);
      });
    });
  });
}

function setupLocal (client, blog, callback) {
  var folder = localPath(blog.id, "/");

  // This tells a running server to start watching this blog
  // folder locally without needing to restart it.
  client.publish(
    "clients:local:new-folder",
    JSON.stringify({ blogID: blog.id }),
    function (err) {
      callback(null, folder);
    }
  );
}
