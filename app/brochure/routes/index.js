var Express = require("express");
var brochure = new Express.Router();

brochure.get("/", function(req, res) {
  res.locals.featured = require("./featured");
  res.locals.layout = 'partials/index-layout';
  res.render("index");
});

brochure.get("/about", function(req, res) {
  res.locals.title = "Blot – About";
  res.render("about");
});


brochure.get("/support", function(req, res) {
  res.locals.title = "Blot – Support";
  res.render("support");
});

brochure.get("/contact", function(req, res) {
  res.locals.title = "Blot – Contact";
  res.render("contact");
});

brochure.get("/terms", function(req, res) {
  res.locals.title = "Blot – Terms of use";
  res.render("terms");
});

brochure.get("/privacy", function(req, res) {
  res.locals.title = "Blot – Privacy policy";
  res.render("privacy");
});

brochure.use("/documentation", require("./documentation"));

brochure.use("/developers", require("./developers"));

brochure.use("/formatting", require("./formatting"));

brochure.use("/templates", require("./templates"));

brochure.use("/news", require("./news"));

brochure.use("/sign-up", require("./sign-up"));

brochure.use("/log-in", require("./log-in"));

module.exports = brochure;
