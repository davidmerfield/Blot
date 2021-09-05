var Express = require("express");
var developers = new Express.Router();
var titleFromSlug = require("helper/titleFromSlug");


developers.use(function (req, res, next) {
  res.locals.base = "/templates/developers";
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

developers.get(['/reference'], function(req, res, next){
    res.locals["show-on-this-page"] = true;
    next();
})
developers.get("/", function (req, res) {
  res.locals.title = "Developer guide - Blot";
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
