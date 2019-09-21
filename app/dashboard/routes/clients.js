var Express = require("express");
var Clients = require("clients");
var clients = Express.Router();

// Some of the clients, like Dropbox, require publicly exposed
// routes. Dropbox uses one to recieve webhooks when it needs
// to fetch changes to a user's folder. Mount them here:

// I should probably consolidate this under /webhooks along with the
// Stripe webhook in ./webhook.js but that's for another day...

var Client;

for (var i in Clients) {
  Client = Clients[i];

  if (!Client.site_routes) continue;

  clients.use("/" + Client.name, Client.site_routes);
}

module.exports = clients;
