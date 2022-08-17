module.exports = {
  display_name: "Dropbox",
  description:
    "A file storage and synchronization service",
  disconnect: require("./disconnect"),
  remove: require("./remove"),
  write: require("./write"),
  site_routes: require("./routes").site,
  dashboard_routes: require("./routes").dashboard,
};
