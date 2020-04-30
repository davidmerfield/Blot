var Express = require("express");
var developers = new Express.Router();
const resolve = require("path").resolve;

require("./tools/build-search-index")(
  "developers",
  resolve(__dirname + "/../views/developers"),
  function(err) {
    if (err) throw err;
    console.log("built search index for developer guide");
  }
);

developers.get("/search", function(req, res) {});

developers.use(function(req, res, next) {
  res.locals.base = "/developers";
  res.locals.layout = "developers/layout";
  res.locals.selected = {};
  next();
});

developers.param("section", function(req, res, next) {
  res.locals.selected[req.params.section] = "selected";
  next();
});

developers.param("subsection", function(req, res, next) {
  res.locals.selected[req.params.subsection] = "selected";
  next();
});

developers.get("/", function(req, res) {
  res.locals.title = "Developers - Blot";
  res.render("developers");
});

developers.get("/:section", function(req, res) {
  res.render("developers/" + req.params.section);
});

developers.get("/:section/:subsection", function(req, res) {
  res.render("developers/" + req.params.section + "/" + req.params.subsection);
});

module.exports = developers;
