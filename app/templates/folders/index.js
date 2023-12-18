// Generate demonstration blogs from the folders inside
// for showing templates and explaining how Blot works
// in the docs. This script will create a blog for each
// folder e.g. one 'bjorn' for folders/bjorn

// 1. Create admin user if none exists
// 2. Create blogs against admin user assuming the
//    handle is not taken.
// 3. Configure each blog with the local client
//    pointing to the source folder. Local client will
//    watch source folder so changes should appear.

const join = require("path").join;
const fs = require("fs-extra");
const async = require("async");
const config = require("config");
const User = require("models/user");
const Blog = require("models/blog");
const basename = require("path").basename;
const DIR = require("helper/rootDir") + "/app/templates/folders";
const format = require("url").format;
const localPath = require("helper/localPath");
const sync = require("sync");
const fix = require("sync/fix");

const updates = {
  bjorn: {
    title: "Björn Allard",
    template: "SITE:portfolio"
  },
  david: {
    title: "David",
    template: "SITE:blog"
  },
  frances: {
    title: "Frances Benjamin Johnston",
    template: "SITE:reference"
  },
  interviews: {
    title: "Interviews",
    template: "SITE:magazine"
  },
  william: {
    title: "William Copeland McCalla",
    template: "SITE:photo"
  }
};

function main (options, callback) {
  if (callback === undefined && typeof options === "function") {
    callback = options;
    options = {};
  }

  loadFoldersToBuild(DIR, function (err, folders) {
    if (err) return callback(err);

    if (options.filter) folders = folders.filter(options.filter);

    setupUser(function (err, user, url) {
      if (err) return callback(err);

      console.log(
        "Established user " + user.email + " to manage demonstration blogs"
      );
      setupBlogs(user, folders, function (err) {
        if (err) return callback(err);

        folders.forEach(function (folder) {
          console.log("http://" + basename(folder) + "." + config.host);
          console.log("Folder:", folder);
          console.log();
        });

        console.log("Dashboard:\n" + url);
        callback(null);
      });
    });
  });
}

function setupUser (_callback) {
  const callback = (err, user) => {
    if (err) return _callback(err);

    User.generateAccessToken({ uid: user.uid }, function (err, token) {
      if (err) return _callback(err);

      // The full one-time log-in link to be sent to the user
      var url = format({
        protocol: "https",
        host: config.host,
        pathname: "/log-in",
        query: {
          token: token
        }
      });

      _callback(null, user, url);
    });
  };

  User.getByEmail(config.admin.email, function (err, user) {
    if (err) return callback(err);

    if (user) return callback(null, user);

    User.create(config.admin.email, config.session.secret, {}, {}, callback);
  });
}

function setupBlogs (user, folders, callback) {
  var blogs = {};

  async.eachSeries(
    folders,
    function (path, next) {
      var handle = basename(path);
      Blog.get({ handle: handle }, function (err, existingBlog) {
        if (err) return next(err);

        if (existingBlog && existingBlog.owner !== user.uid)
          return next(
            new Error(existingBlog.handle + " owned by another user")
          );

        if (existingBlog) {
          blogs[existingBlog.id] = { path, blog: existingBlog };
          return next();
        }

        Blog.create(user.uid, { handle: handle }, function (err, newBlog) {
          if (err) return next(err);
          blogs[newBlog.id] = { path, blog: newBlog };
          next();
        });
      });
    },
    function (err) {
      if (err) return callback(err);
      async.eachOfSeries(
        blogs,
        function ({ path, blog }, id, next) {
          const update = updates[blog.handle] || {};

          Blog.set(id, update, async function (err) {
            if (err) return next(err);

            // replace the contents of the blog folder 'localPath(id, "/")'
            // with the contents of the folder 'path', overwriting anything
            // and removing anything that is not in 'path'
            await fs.remove(localPath(blog.id, "/"));
            await fs.copy(path, localPath(blog.id, "/"));

            // resync the folder
            sync(blog.id, async function (err, folder, done) {
              if (err) return next(err);

              // walk the contents of the folder and call folder.update
              // in series for each file
              // path must be relative to the root of the blog folder
              const walk = async dir => {
                const items = await fs.readdir(dir);
                for (const name of items) {
                  const path = join(dir, name);
                  const stat = await fs.stat(path);
                  if (stat.isDirectory()) {
                    await walk(path);
                  } else {
                    await new Promise((resolve, reject) => {
                      const relativePath = path.slice(
                        localPath(blog.id, "/").length
                      );
                      folder.update(relativePath, {}, function (err) {
                        if (err) return reject(err);
                        resolve();
                      });
                    });
                  }
                }
              };

              await walk(localPath(blog.id, "/"));

              fix(blog, function (err) {
                if (err) return done(err);

                done(null, next);
              });
            });
          });
        },
        callback
      );
    }
  );
}

function loadFoldersToBuild (foldersDirectory, callback) {
  fs.readdir(foldersDirectory, function (err, folders) {
    if (err) return callback(err);

    folders = folders
      .map(function (name) {
        return foldersDirectory + "/" + name;
      })
      .filter(function (path) {
        return (
          basename(path)[0] !== "-" &&
          basename(path)[0] !== "." &&
          fs.statSync(path).isDirectory()
        );
      });

    callback(null, folders);
  });
}

if (require.main === module) {
  var options = {};

  if (process.argv[2])
    options.filter = function (path) {
      return path.indexOf(process.argv[2]) > -1;
    };

  main(options, function (err) {
    if (err) throw err;
    process.exit();
  });
}

module.exports = main;
