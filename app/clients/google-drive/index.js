module.exports = {
  display_name: "Google Drive",
  description: "A file storage and synchronization service",
  disconnect: require("./disconnect"),
  remove: require("./remove"),
  write: require("./write"),
  site_routes: require("./routes/site"),
  dashboard_routes: require("./routes/dashboard"),
};

// Redirect the OAUTH callback URL to blot's server
if (require('config').environment === 'development') {
  require('./util/redirect-server');
}