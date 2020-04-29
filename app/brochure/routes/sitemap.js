var config = require("config");

module.exports = function(req, res) {
  res.locals.layout = "";
  res.locals.protocol = req.protocol;
  res.locals.host = config.host;
  res.locals.urls = [
    "/",
    "/sign-up",
    "/log-in",
    "/how",
    "/how/templates",
    "/how/pages",
    "/how/public-files",
    "/how/metadata",
    "/how/clients",
    "/how/guides",
    "/developers",
    "/contact",
    "/about",
    "/news"
  ];
  res.setHeader("Content-Type", "text/xml");
  res.render("sitemap");
};
