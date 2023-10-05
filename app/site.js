var Express = require("express");
var dashboard = require("./dashboard");
var documentation = require("./documentation");
var site = Express();
var config = require("config");

// Hide the header added by Express
site.disable("x-powered-by");

// Trusts secure requests terminated by NGINX, as far as I know
site.set("trust proxy", ["loopback", ...config.reverse_proxies]);

site.set("etag", false); // turn off etags for responses

site.get("/health", (req, res) => {
  res.send("OK");
});

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
