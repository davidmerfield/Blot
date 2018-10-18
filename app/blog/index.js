var express = require("express");
var config = require("config");
var compression = require("compression");
var cache = require("express-disk-cache")(config.cache_directory);
var debug = require("./debug");

// This serves the content
// of users' blogs
var blog = express();

// Custom domain & subdomain middleware
// also handles the mapping of preview domains
blog
  .disable("x-powered-by")
  .use(compression())
  .use(debug.init)
  .use(debug("fetching host from db"))
  .use(require("./vhosts"))
  .use(require("./add")());

if (config.cache) {
  blog.use(cache);
}

blog.use(debug("loading template from db"));
blog.use(require("./loadTemplate"));

// Load in the rendering engine
blog.use(require("./render"));

// The order of these routes is important
require("./draft")(blog);
require("./tagged")(blog);
require("./search")(blog);
require("./robots")(blog);
require("./view")(blog);
require("./entry")(blog);
require("./entries")(blog);
blog.use(require("./assets"));
require("./public")(blog);
require("./error")(blog);

module.exports = blog;
