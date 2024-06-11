var config = require("config");
var Express = require("express");
var helmet = require("helmet");
var vhost = require("vhost");
var blog = require("blog");
var site = require("site");
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

console.log(
  clfdate(),
  "Starting server on port",
  config.port,
  "host",
  config.host
);

// Trusts secure requests terminated by NGINX, as far as I know
server.set("trust proxy", true);

// Check if the database is healthy
server.get("/redis-health", function (req, res) {
  let redis = require("models/redis");
  let client = redis();

  // do not cache response
  res.set("Cache-Control", "no-store");

  client.ping(function (err, reply) {
    if (err) {
      res.status(500).send("Failed to ping redis");
    } else {
      res.send("OK");
    }

    client.quit();
  });
});

// Prevent <iframes> embedding pages served by Blot
server.use(helmet.frameguard("allow-from", config.host));

// Log response time in development mode
server.use(trace.init);

let unrespondedRequests = [];

setInterval(function () {
  console.log(
    clfdate(),
    "PID=" + process.pid,
    "PENDING=" + unrespondedRequests.length,
    unrespondedRequests.join(", ")
  );
}, 1000 * 15); // 15 seconds
server.use(function (req, res, next) {
  var init = Date.now();

  try {
    if (req.headers["x-request-id"])
      unrespondedRequests.push(req.headers["x-request-id"].slice(0, 8));

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
      if (req.headers["x-request-id"])
        unrespondedRequests = unrespondedRequests.filter(
          id => id !== req.headers["x-request-id"].slice(0, 8)
        );
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

  req.on("close", function () {
    try {
      if (req.headers["x-request-id"])
        unrespondedRequests = unrespondedRequests.filter(
          id => id !== req.headers["x-request-id"].slice(0, 8)
        );
      console.log(
        clfdate(),
        req.headers["x-request-id"] && req.headers["x-request-id"],
        "Connection closed by client",
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

// CDN server
server.use(vhost("cdn." + config.host, require("./cdn")));

// The Blogs
// ---------
// Serves the customers's blogs. It should come first because it's the
// most important. We don't know the hosts for all the blogs in
// advance so all requests hit this middleware.
server.use(blog);

// Monit, which we use to monitor the server's health, requests
// localhost/health to see if it should attempt to restart Blot.
// If you remove this, change monit.rc too.
server.get("/health", function (req, res) {
  // do not cache response
  res.set("Cache-Control", "no-store");
  res.send("OK");
});

module.exports = server;
