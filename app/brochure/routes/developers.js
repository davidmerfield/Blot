var Express = require("express");
var developers = new Express.Router();
var titleFromSlug = require("helper/titleFromSlug");

var TITLES = {
  "json-feed": "JSON feed",
  "posts-tagged": "Posts by tag",
};

developers.use(function (req, res, next) {
  res.locals.base = "/templates/developers";

  var url = req.originalUrl;
  let slug = url.split("/").pop();
  let title = TITLES[slug] || titleFromSlug(slug);
  res.locals.title = title;

  next();
});

developers.param("section", function (req, res, next) {
  res.locals.selected[req.params.section] = "selected";
  next();
});

developers.param("subsection", function (req, res, next) {
  res.locals.selected[req.params.subsection] = "selected";
  next();
});

developers.get("/", function (req, res) {
  res.locals.title = "Developers - Blot";
  res.render("templates/developers");
});

developers.get("/:section", function (req, res) {
  res.render("templates/developers/" + req.params.section);
});

developers.get("/:section/:subsection", function (req, res) {
  res.render(
    "templates/developers/" + req.params.section + "/" + req.params.subsection
  );
});

module.exports = developers;
