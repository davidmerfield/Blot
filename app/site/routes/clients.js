var clients = require('clients');

// Some of the clients, like Dropbox, require publicly exposed
// routes. Dropbox uses one to recieve webhooks when it needs
// to fetch changes to a user's folder. Mount them here:

module.exports = function (site) {

  var client;

  for (var i in clients) {

    client = clients[i];

    if (!client.site_routes) continue;

    site.use('/clients/' + client.name, client.site_routes);
  }
};