var config = require("config");

module.exports = function(req, res, next) {
  res.locals.layout = "";
  res.locals.protocol = req.protocol;
  res.locals.host = config.host;
  res.locals.urls = [
    "/",
    "/documentation",
    "/support",
    "/sign-up",
    "/log-in",
    "/contact",
    "/about",
    "/developers",
    "/formatting"
  ];
  res.setHeader("Content-Type", "text/xml");
  res.render("sitemap");
};
