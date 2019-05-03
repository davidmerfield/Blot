var defaultPlugins = require("../../build/plugins").defaultList;
var defaultTemplate = require("../template").defaultTemplate;

module.exports = {
  client: "",
  title: "Blog",
  isDisabled: false,
  avatar: "",
  roundAvatar: false,
  cssURL: "",
  scriptURL: "",
  template: defaultTemplate,
  menu: [
    { id: Date.now() + 1 + "", label: "Home", url: "/" },
    { id: Date.now() + 2 + "", label: "Archives", url: "/archives" },
    { id: Date.now() + 3 + "", label: "Search", url: "/search" },
    { id: Date.now() + 4 + "", label: "Feed", url: "/feed.rss" }
  ],
  domain: "",
  permalink: { format: "{{slug}}", custom: "", isCustom: false },
  timeZone: "UTC",
  dateFormat: "M/D/YYYY",
  dateDisplay: "MMMM D, Y",
  hideDates: false,
  forceSSL: false,
  redirectSubdomain: true,
  plugins: defaultPlugins,
  cacheID: 0
};
