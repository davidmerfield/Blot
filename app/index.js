var config = require("config");
var Express = require("express");
var helmet = require("helmet");
var vhost = require("vhost");

var blog = require("./blog");
var brochure = require("./brochure");
var dashboard = require("./dashboard");
var scheduler = require("./scheduler");

// Welcome to Blot. This is the Express application which listens on port 8080.
// NGINX listens on port 80 in front of Express app and proxies requests to
// port 8080. NGINX handles SSL termination, cached response delivery and
// compression. See ../config/nginx for more. Blot does the rest.
var Blot = Express();

// Removes a header otherwise added by Express. No wasted bytes
Blot.disable("x-powered-by");

// Trusts secure requests terminated by NGINX, as far as I know
Blot.set("trust proxy", "loopback");

// Prevent <iframes> embedding pages served by Blot
Blot.use(helmet.frameguard("allow-from", config.host));

// Blot is composed of three sub applications.

// The Dashboard
// -------------
// Serve the dashboard and public site (the brochure)
// Webhooks from Dropbox and Stripe, git pushes are
// served by these two applications. The dashboard can
// only ever be served for request to the host
Blot.use(vhost(config.host, dashboard));

// The Brochure
// ------------
// The least important application. It serves the documentation
// and sign up page.
Blot.use(vhost(config.host, brochure));

// The Blogs
// ---------
// Serves the customers's blogs. It should come first because it's the
// most important. We don't know the hosts for all the blogs in
// advance so all requests hit this middleware.
Blot.use(blog);

// Monit, which we use to monitor the server's health, requests
// localhost/health to see if it should attempt to restart Blot.
// If you remove this, change monit.rc too.
Blot.use("/health", function(req, res) {
  res.send("OK");
});

// Open the server to handle requests
Blot.listen(config.port);

// Schedule backups, subscription renewal emails
// and the publication of scheduled blog posts.
scheduler();
