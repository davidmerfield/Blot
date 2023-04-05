var config = require("config");
var Express = require("express");
var helmet = require("helmet");
var vhost = require("vhost");
var blog = require("./blog");
var site = require("./site");
var clfdate = require("helper/clfdate");
var trace = require("helper/trace");

// Welcome to Blot. This is the Express application which listens on port 8080.
// NGINX listens on port 80 in front of Express app and proxies requests to
// port 8080. NGINX handles SSL termination, cached response delivery and
// compression. See ../config/nginx for more. Blot does the rest.
var server = Express();

server.set("etag", false); // turn off etags for responses

// Removes a header otherwise added by Express. No wasted bytes
server.disable("x-powered-by");

// Trusts secure requests terminated by NGINX, as far as I know
server.set("trust proxy", "loopback");

// Prevent <iframes> embedding pages served by Blot
server.use(helmet.frameguard("allow-from", config.host));

// Log response time in development mode
server.use(trace.init);

server.use(function (req, res, next) {
  var init = Date.now();

  try {
    console.log(
      clfdate(),
      req.headers["x-request-id"] && req.headers["x-request-id"],
      "PID=" + process.pid,
      req.protocol + "://" + req.hostname + req.originalUrl,
      req.method
    );
  } catch (e) {
    console.error("Error: Failed to construct canonical log line:", e);
  }

  res.on("finish", function () {
    try {
      console.log(
        clfdate(),
        req.headers["x-request-id"] && req.headers["x-request-id"],
        res.statusCode,
        ((Date.now() - init) / 1000).toFixed(3),
        "PID=" + process.pid,
        req.protocol + "://" + req.hostname + req.originalUrl
      );
    } catch (e) {
      console.error("Error: Failed to construct canonical log line:", e);
    }
  });

  next();
});

// Blot is composed of two sub applications.

// The Site
// -------------
// Serve the dashboard and public site (the documentation)
// Webhooks from Dropbox and Stripe, git pushes are
// served by these two applications. The dashboard can
// only ever be served for request to the host
server.use(vhost(config.host, site));

// The Webhook forwarder
// -------------
// Forwards webhooks to development environment
if (config.webhooks.server_host) {
  console.log(clfdate(), "Webhooks relay on", config.webhooks.server_host);
  server.use(vhost(config.webhooks.server_host, require("./clients/webhooks")));
}

// The Blogs
// ---------
// Serves the customers's blogs. It should come first because it's the
// most important. We don't know the hosts for all the blogs in
// advance so all requests hit this middleware.
server.use(blog);

// Monit, which we use to monitor the server's health, requests
// localhost/health to see if it should attempt to restart Blot.
// If you remove this, change monit.rc too.
server.use("/health", function (req, res) {
  res.send("OK");
});

module.exports = server;
