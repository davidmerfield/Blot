module.exports = {
  display_name: "Git",
  description: "Use a git repository",

  remove: require("./remove"),
  write: require("./write"),
  disconnect: require("./disconnect"),
  dashboard_routes: require("./routes").dashboard,
  site_routes: require("./routes").site
};
