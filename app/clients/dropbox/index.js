module.exports = {
  display_name: "Dropbox",
  description:
    "A service that makes all of a user’s files available from any computer or phone.",
  disconnect: require("./disconnect"),
  remove: require("./remove"),
  write: require("./write"),
  site_routes: require("./routes").site,
  dashboard_routes: require("./routes").dashboard
};
