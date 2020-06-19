var Express = require("express");
var config = require("config");

var debug = require("./tools/debug");
var cache = require("express-disk-cache")(config.cache_directory);

// This serves the content
// of users' blogs
var blog = Express();

// Allows use to trace the path of the request
// through our application code
blog.use(debug.init);

// Removes a header added by default by Express
blog.disable("x-powered-by");

// Load in the rendering engine
blog.use(require("./render/middleware"));

// Utility to add locals and partials
blog.use(require("./tools/add")({}));

// Loads template specific metadata
blog.use(debug("loading blog"));
blog.use(require("./tools/loadBlog"));
blog.use(debug("loaded blog"));

blog.use(debug("checking preview subdomain"));
blog.use(require("./tools/checkPreviewSubdomain"));
blog.use(debug("checked preview subdomain"));

blog.use(debug("checking redirector"));
blog.use(require("./tools/redirector"));
blog.use(debug("checked redirector"));

// Loads template specific metadata
blog.use(debug("loading template"));
blog.use(require("./tools/loadTemplate"));
blog.use(debug("loaded template"));

if (config.cache) blog.use(cache);

// The order of these routes is important
require("./routes/draft")(blog);
require("./routes/tagged")(blog);
require("./routes/search")(blog);
require("./routes/robots")(blog);
require("./routes/view")(blog);
require("./routes/entry")(blog);
require("./routes/entries")(blog);
blog.use(require("./routes/assets"));
require("./routes/public")(blog);
require("./routes/error")(blog);

module.exports = blog;
