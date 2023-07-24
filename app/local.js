var config = require("config");
var async = require("async");
var Express = require("express");
const User = require("models/user");
const Blog = require("models/blog");
const child_process = require("child_process");

// I was getting a warning message from npm when I 'cntrl-c' out
// of the server without this.
process.on("SIGINT", () => {
  process.exit();
});

// A few sanity checks before we begin
let nodeVersion, redisPing;

const REQUIRED_NODE_VERSION = "v16.14.0";

try {
  nodeVersion = child_process.execSync("node -v").toString().trim();
} catch (e) {}

try {
  redisPing = child_process.execSync("redis-cli ping").toString().trim();
} catch (e) {}

if (nodeVersion !== REQUIRED_NODE_VERSION) {
  console.error(
    `Error: required version of node unavailable.
     Please install and use node version: ${REQUIRED_NODE_VERSION}
     `
  );
  return process.exit(1);
}

if (redisPing !== "PONG") {
  console.error(
    `Error: redis server not running. Please install and run a redis server
    `
  );
  return process.exit(1);
}

console.log("Local server capabilities:");
console.log("- twitter embeds " + !!config.twitter.consumer_secret);
console.log("- markdown with pandoc  " + !!config.pandoc.bin);
console.log("- .docx conversion  " + !!config.pandoc.bin);
console.log("- .odt conversion  " + !!config.pandoc.bin);
console.log("- dropbox client " + !!config.dropbox.app.key);
console.log("- persistent dashboard sessions  " + !!config.session.secret);

// Welcome to Blot. This is the Express application which listens on port 8080.
// NGINX listens on port 80 in front of Express app and proxies requests to
// port 8080. NGINX handles SSL termination, cached response delivery and
// compression. See ../config/nginx for more. Blot does the rest.
const email = "example@example.com";

function establishTestUser(callback) {
  User.getByEmail(email, function (err, user) {
    if (user) return callback(null, user);
    User.create(email, "", {}, callback);
  });
}

function establishTestBlog(user, callback) {
  if (user.blogs.length > 0) return callback(null, user);

  Blog.create(user.uid, { handle: "example" }, function (err, blog) {
    if (err) return callback(err);
    user.blogs.push(blog.id);
    callback(null, user);
  });
}

function configureBlogs(user, callback) {
  let port = parseInt(config.port);
  async.eachSeries(
    user.blogs,
    (blogID, next) => {
      Blog.get({ id: blogID }, (err, blog) => {
        if (err) return next(err);
        Blog.set(blogID, { forceSSL: false, client: "local" }, (err) => {
          if (err) return next(err);

          var blogServer = Express();

          blogServer.use(function (req, res, next) {
            var _get = req.get;
            req.get = function (p) {
              if (p === "host") return "example.localhost";
              return _get(p);
            };
            next();
          });

          port++;

          blogServer.use(require("./blog"));
          blogServer.listen(port);

          console.log();
          console.log(`Visit your dashboard:`);
          console.log("http://localhost:" + config.port);
          console.log();

          console.log(`Visit your blog:`);
          console.log(`http://localhost:${port}`);
          console.log();

          console.log(`Open your blog's folder:`);
          console.log(config.blot_directory + "/tmp/" + blog.handle);
          console.log();

          require("clients/local").setup(blogID, next);
        });
      });
    },
    (err) => {
      callback(err, user);
    }
  );
}

async.waterfall(
  [establishTestUser, establishTestBlog, configureBlogs],
  function (err, user) {
    if (err) throw err;

    // Built and watch template directory
    require("./templates")({ watch: true }, function (err) {
      if (err) throw err;
    });

    // Blot is composed of four sub applications.

    // The Dashboard
    // -------------
    // Serve the dashboard and public site (the documentation)
    // Webhooks from Dropbox and Stripe, git pushes are
    // served by these two applications. The dashboard can
    // only ever be served for request to the host
    var dashboardServer = Express();

    dashboardServer.use(require("cdn"));

    dashboardServer.use(require("dashboard/session"));

    dashboardServer.use(function (req, res, next) {
      req.session.uid = user.uid;
      req.session.blogID = user.lastSession;
      next();
    });

    dashboardServer.use(require("./dashboard"));

    dashboardServer.listen(config.port);
  }
);
