var Express = require("express");
var notes = new Express.Router();
var notesDirectory = require("helper").rootDir + "/notes";
var marked = require("marked");

notes.use(function(req, res, next) {
  res.locals.base = "/notes";
  res.locals.layout = "notes/layout";
  res.locals.selected = {};
  next();
});

notes.param("section", function(req, res, next) {
  res.locals.selected[req.params.section] = "selected";
  next();
});

notes.param("subsection", function(req, res, next) {
  res.locals.selected[req.params.subsection] = "selected";
  next();
});

notes.get("/", function(req, res) {
  res.locals.title = "Notes - Blot";
  res.render("notes");
});

notes.get("/:section", function(req, res) {
  res.render("notes/" + req.params.section);
});

notes.get("/:section/:subsection", function(req, res) {
  res.locals.layout = "";
  res.locals.body = marked(
    require("fs").readFileSync(
      notesDirectory +
        "/" +
        req.params.section +
        "/" +
        req.params.subsection +
        ".txt",
      "utf-8"
    )
  );
  res.render("notes/layout");
});

module.exports = notes;
