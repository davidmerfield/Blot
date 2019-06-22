var config = require("config");

module.exports = function(req, res) {
  res.locals.layout = "";
  res.locals.protocol = req.protocol;
  res.locals.host = config.host;
  res.locals.urls = [
    "/",
    "/sign-up",
    "/log-in",
    "/publishing",
    "/publishing/templates",
    "/publishing/pages",
    "/publishing/public-files",
    "/publishing/metadata",
    "/publishing/clients",
    "/publishing/guides",
    "/developers",
    "/contact",
    "/about",
    "/news"
  ];
  res.setHeader("Content-Type", "text/xml");
  res.render("sitemap");
};
