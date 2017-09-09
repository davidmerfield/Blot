module.exports = {
  routes: {
    dashboard: require('./routes').dashboard,
    site: require('./routes').site,
  },
  remove: require('./client').remove,
  write: require('./client').write,
  database: require('database')
};