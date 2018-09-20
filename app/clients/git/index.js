module.exports = {
  display_name: "Git",
  description: "Use a git repository",

  remove: require("./client").remove,
  write: require("./client").write,
  disconnect: require("./client").disconnect,
  dashboard_routes: require("./routes/private"),
  site_routes: require("./routes/public")
};
