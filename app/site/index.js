const Express = require("express");
const dashboard = require("dashboard");
const documentation = require("documentation");
const mustache = require("helper/express-mustache");
const root = require("helper/rootDir");
const config = require("config");
const { join } = require("path");

const VIEW_DIRECTORY = join(root, "app/documentation/data");

// Cache ID is used for the static assets
// eventually remove this when you merge
// the assets into a single file
const cacheID = Date.now();

const cdnURLHelper = require('documentation/tools/cdn-url-helper');

const site = Express();

site.locals.cdn = cdnURLHelper({cacheID, viewDirectory: VIEW_DIRECTORY});

// Hide the header added by Express
site.disable("x-powered-by");

// Trusts secure requests terminated by NGINX, as far as I know
site.set("trust proxy", true);

site.set("etag", false); // turn off etags for responses

// Register the engine we will use to
// render the views.
site.set("view engine", "html");
site.set("views", VIEW_DIRECTORY);
site.engine("html", mustache);

// For when we want to cache templates
if (config.environment !== "development") {
  site.enable("view cache");
}

const { plan } = config.stripe;

site.locals.layout = "partials/layout";
site.locals.ip = config.ip;
site.locals.date = require("documentation/dates");
site.locals.price = "$" + plan.split("_").pop();
site.locals.interval = plan.startsWith("monthly") ? "month" : "year";
site.locals.cacheID = cacheID;

site.locals.cdnURL = config.cdn.origin;
site.locals.cdn = cdnURLHelper({cacheID, viewDirectory: VIEW_DIRECTORY});

site.get("/health", (req, res) => {
  res.send("OK");
});

// If the site is in maintenance mode, show the maintenance page
// rather than render the dashboard or any routes manipulate state
if (config.maintenance) {
  site.use(["/sites", "/clients", "/stripe-webhook", "/paypal-webhook"], (req, res) => {
    res.status(503);
    res.send("Down for maintenance");
  });
}

// The dashboard
// -------
site.use("/sites", dashboard);

// The client requests handler
site.use("/clients", require("clients/routes"));

// The stripe webhook handler
site.use("/stripe-webhook", require("dashboard/webhooks/stripe_webhook"));

site.use("/paypal-webhook", require("dashboard/webhooks/paypal_webhook"));

// The documentation
// ------------
// The least important application. It serves the documentation
site.use(documentation);

module.exports = site;
