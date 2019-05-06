require("../only_locally");

var fs = require("fs-extra");
var helper = require("helper");
var async = require("async");
var access = require("../access");
var ROOT = helper.rootDir;
var config = require("config");
var BLOG_FOLDERS_DIRECTORY = ROOT + "/blogs";
var GIT_CLIENTS_DATA = ROOT + "/app/clients/git/data";
var STATIC_FILES_DIRECTORY = ROOT + "/static";
var exec = require("child_process").exec;
var colors = require("colors/safe");

function main(label, callback) {
  var directory = __dirname + "/data/" + label;

  loadDB(directory, function(err) {
    if (err) return callback(err);

    fs.copySync(directory + "/blogs", BLOG_FOLDERS_DIRECTORY);
    fs.copySync(directory + "/git", GIT_CLIENTS_DATA);
    fs.copySync(directory + "/static", STATIC_FILES_DIRECTORY);

    printBlogs(callback);
  });
}

function ensureRedisIsShutdown(callback) {
  var redis = require("redis");
  var client = redis.createClient();

  client.on("error", function(err) {
    if (err.code === "ECONNREFUSED") {
      return callback(null);
    } else {
    }
  });

  var multi = client.multi();

  multi.config("SET", "appendonly", "no");
  multi.config("SET", "save", "");
  multi.shutdown();

  multi.exec(function(err) {
    if (err && err.code !== "ECONNREFUSED" && err.code !== "UNCERTAIN_STATE")
      return callback(err);

    callback(null);
  });
}

function loadDB(directory, callback) {
  var dump = directory + "/dump.rdb";

  if (!fs.existsSync(dump)) return callback(new Error("NOENT " + dump));

  ensureRedisIsShutdown(function(err) {
    if (err) return callback(err);

    exec(
      "redis-server " + ROOT + "/config/redis.conf",
      { silent: true },
      function(err) {
        if (err) return callback(err);

        callback(null);
      }
    );
  });
}

function printBlogs(callback) {
  var Blog = require("blog");

  Blog.getAllIDs(function(err, ids) {
    if (err) return callback(err);

    if (ids && ids.length > 10) {
      console.log("Too many blogs to log in");
      return callback();
    }

    async.each(
      ids,
      function(id, next) {
        Blog.get({ id: id }, function(err, blog) {
          if (err) return next(err);
          setupFolder(blog, function(err, folder) {
            if (err) return next(err);
            access(blog.handle, function(err, url) {
              if (err) return next(err);

              console.log();
              console.log(colors.yellow(blog.title), "-", colors.dim(blog.id));
              console.log("Dashboard:", url);
              console.log("Blog:", "http://" + blog.handle + "." + config.host);
              console.log("Folder:", folder);
              next();
            });
          });
        });
      },
      callback
    );
  });
}

function setupFolder(blog, callback) {
  if (blog.client === "dropbox") {
    console.log(blog.handle, "uses dropbox client");
  } else if (blog.client === "local") {
    console.log(blog.handle, "uses local client");
  } else if (blog.client === "git") {
    console.log(blog.handle, "uses git client");
  } else {
    console.log(blog.handle, "uses unknown client");
    callback();
  }
}

if (require.main === module) {
  main(process.argv[2], function(err) {
    if (err) throw err;
    process.exit();
  });
}

module.exports = main;
