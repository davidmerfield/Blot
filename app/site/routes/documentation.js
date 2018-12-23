var express = require("express");
var Documentation = express.Router();

Documentation.use(function(req, res, next) {
  res.locals.selected = {};
  next();
});

Documentation.param("section", function(req, res, next, section) {
  res.locals.selected[section] = "selected";
  next();
});

Documentation.param("page", function(req, res, next, page) {
  res.locals.selected[page] = "selected";
  next();
});

Documentation.get("/", function(req, res, next) {
  res.locals.selected.how = "selected";

  res.locals.partials = {
    sidebar: "documentation/partials/sidebar",
    header: "documentation/partials/header",
    footer: "documentation/partials/footer",
    "documentation.css": "documentation/documentation.css"
  };

  res.render("documentation/index");
});

var marked = require("marked");

Documentation.get("/updates", function(req, res, next) {

  var todo = require("path").resolve(__dirname + "/../../../todo.txt")
  res.locals.todo = marked(
    require('fs-extra').readFileSync(
      todo,
      "utf-8"
    )
  );

  res.locals.partials = {
    sidebar: "documentation/partials/sidebar",
    header: "documentation/partials/header",
    footer: "documentation/partials/footer",
    yield: "documentation/updates",
    "documentation.css": "documentation/documentation.css"
  };

  res.render("documentation/partials/layout");
});

Documentation.get("/:section", function(req, res, next) {
  res.locals.partials = {
    sidebar: "documentation/partials/sidebar",
    header: "documentation/partials/header",
    footer: "documentation/partials/footer",
    yield: "documentation/" + req.params.section,
    "documentation.css": "documentation/documentation.css"
  };

  res.render("documentation/partials/layout");
});

Documentation.get("/:section/:page", function(req, res, next) {
  res.locals.partials = {
    sidebar: "documentation/partials/sidebar",
    header: "documentation/partials/header",
    footer: "documentation/partials/footer",
    yield: "documentation/" + req.params.section + "/" + req.params.page,
    "documentation.css": "documentation/documentation.css"
  };

  res.render("documentation/partials/layout");
});

module.exports = Documentation;
