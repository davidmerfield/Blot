module.exports = {
  display_name: "iCloud",
  description: "Use a folder in your iCloud drive",

  remove: require("./remove"),
  write: require("./write"),
  disconnect: require("./disconnect"),
  dashboard_routes: require("./routes").dashboard,
  site_routes: require("./routes").site,
};

console.log('loaded');