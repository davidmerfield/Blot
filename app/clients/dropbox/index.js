var routes = require('./routes');
var client = require('./client');

module.exports = {
  display_name: 'Dropbox',
  description: 'A service that makes all of a user’s files available from any computer or phone. ',
  disconnect: client.disconnect,
  remove: client.remove,
  write: client.write,
  site_routes: routes.site,
  dashboard_routes: routes.dashboard
};