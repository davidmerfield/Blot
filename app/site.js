var Express = require("express");
var dashboard = require("./dashboard");
var documentation = require("./documentation");
var cdn = require("./documentation/static");
var site = Express();

// Hide the header added by Express
site.disable("x-powered-by");

site.set("etag", false); // turn off etags for responses

// The dashboard
// -------
site.use("/dashboard", dashboard);

// The client requests handler
site.use("/clients", require("clients/routes"));

// The stripe webhook handler
site.use("/stripe-webhook", require("./dashboard/stripe_webhook"));

// The documentation
// ------------
// The least important application. It serves the documentation
site.use(documentation);

module.exports = site;
