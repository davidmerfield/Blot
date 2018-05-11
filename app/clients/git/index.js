var init = require('./init');

init();

module.exports = {
  display_name: 'Git',
  description: 'Use a git repository',
  remove: require('./client').remove,
  write: require('./client').write,
  disconnect: require('./client').disconnect,
  dashboard_routes: require('./dashboard'),
  site_routes: require('./site')
};