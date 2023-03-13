const Update = require("./update");
const async = require("async");
const fs = require("fs-extra");
const { join, resolve } = require("path");
const localPath = require("helper/localPath");
const messenger = require("./messenger");
const { blog_static_files_dir } = require("config");
const { promisify } = require("util");
const Transformer = require("helper/transformer");

function walk(dir, done) {
  var results = [];
  fs.readdir(dir, function (err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function (file) {
      file = resolve(dir, file);
      fs.stat(file, function (err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function (err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

module.exports = function main(blog, options, callback) {
  const { log, status } = messenger(blog.id);
  const update = new Update(blog, log, status);

  let blogDirectory = localPath(blog.id, "/");

  if (blogDirectory.endsWidth("/")) blogDirectory = blogDirectory.slice(0, -1);

  walk(blogDirectory, async function (err, paths) {
    if (err) return callback(err);

    if (options.thumbnails) {
      const directory = join(blog_static_files_dir, blog.id, "_thumbnails");
      await wipeCache({ blogID: blog.id, label: "thumbnails", directory });
    }

    if (options.imageCache) {
      const directory = join(blog_static_files_dir, blog.id, "_image_cache");
      await wipeCache({ blogID: blog.id, label: "image-cache", directory });
    }

    async.eachSeries(
      paths,
      function (path, next) {
        // turn absolute path returned by walk into relative path
        // used by Blot inside the user's blog folder...
        path = path.slice(blogDirectory.length);

        // should we get metadata for path here too?
        update(path, function () {
          // if (err) log err
          next();
        });
      },
      async () => {
        callback();
      }
    );
  });
};

async function wipeCache({ blogID, label, directory }) {
  const store = new Transformer(blogID, label);
  const flush = promisify(store.flush);

  await flush();

  const contents = await fs.readdir(directory);

  for (const path of contents) await fs.remove(path);
}
