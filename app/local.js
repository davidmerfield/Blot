// I was getting a warning message from npm when I 'cntrl-c' out
// of the server without this.
process.on("SIGINT", () => {
  process.exit();
});

const server = require("./server");
const config = require("config");
const buildDocumentation = require("documentation/build");

console.log("Local server capabilities:");
console.log("- twitter embeds " + !!config.twitter.consumer_secret);
console.log("- markdown with pandoc  " + !!config.pandoc.bin);
console.log("- .docx conversion  " + !!config.pandoc.bin);
console.log("- .odt conversion  " + !!config.pandoc.bin);
console.log("- dropbox client " + !!config.dropbox.app.key);
console.log("- persistent dashboard sessions  " + !!config.session.secret);

server.listen(config.port, err => {
  if (err) throw err;
  console.log(`Local server running on port ${config.port}`);
  async.waterfall(
    [
      buildTemplates.bind(null, { watch: false }),
      establishTestUser,
      establishTestBlog,
      configureBlogs
    ],
    async function (err, user) {
      if (err) throw err;

      await buildDocumentation({ watch: config.environment === "development" });
    }
  );
});

const async = require("async");
const User = require("models/user");
const Blog = require("models/blog");
const buildTemplates = require("./templates");

// Welcome to Blot. This is the Express application which listens on port 8080.
// NGINX listens on port 80 in front of Express app and proxies requests to
// port 8080. NGINX handles SSL termination, cached response delivery and
// compression. See ../config/nginx for more. Blot does the rest.
const email = "example@example.com";
const password = "password";

function establishTestUser (callback) {
  User.getByEmail(email, function (err, user) {
    if (user) return callback(null, user);
    User.hashPassword(password, function (err, passwordHash) {
      if (err) throw err;
      User.create(email, passwordHash, {}, {}, callback);
    });
  });
}

function establishTestBlog (user, callback) {
  if (user.blogs.length > 0) return callback(null, user);

  Blog.create(user.uid, { handle: "example" }, function (err, blog) {
    if (err) return callback(err);
    user.blogs.push(blog.id);
    callback(null, user);
  });
}

function configureBlogs (user, callback) {
  async.eachSeries(
    user.blogs,
    (blogID, next) => {
      Blog.get({ id: blogID }, (err, blog) => {
        if (err) return next(err);
        Blog.set(blogID, { forceSSL: false, client: "local" }, err => {
          if (err) return next(err);

          console.log();
          console.log(`Visit your dashboard:`);
          console.log(`https://${config.host}`);
          console.log();

          console.log(`Visit your blog:`);
          console.log(`https://${blog.handle}.${config.host}`);
          console.log();

          console.log(`Open your blog's folder:`);
          console.log("./data/blogs/" + blog.id);
          console.log();

          next();
        });
      });
    },
    err => {
      callback(err, user);
    }
  );
}
