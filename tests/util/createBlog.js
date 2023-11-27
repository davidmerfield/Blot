var Blog = require("models/blog");
var randomString = require("./randomString");
var localPath = require("helper/localPath");
const fs = require("fs-extra");
const { join } = require("path");
const { promisify } = require("util");
const rebuild = promisify(require("sync/rebuild"));
const checkEntry = require("./checkEntry");

module.exports = function (done) {
  var context = this;

  Blog.create(context.user.uid, { handle: randomString(16) }, function (
    err,
    blog
  ) {
    if (err) {
      return done(new Error(err.handle));
    }

    context.blogDirectory = localPath(blog.id, "/");

    if (context.blogDirectory.slice(-1) === "/")
      context.blogDirectory = context.blogDirectory.slice(0, -1);

    context.blog = blog;

    context.blog.write = async ({ path, content }) => {
      await fs.outputFile(join(context.blogDirectory, path), content);
    };

    context.blog.rebuild = async (options = {}) =>
      await rebuild(context.blog.id, options);

    context.blog.check = async (entry) =>
      await promisify(checkEntry(context.blog.id))(entry);

    done(err);
  });
};
