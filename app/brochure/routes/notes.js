var Express = require("express");
var notes = new Express.Router();
var notesDirectory = require("helper").rootDir + "/notes";
var marked = require('marked');

notes.use(function(req, res, next) {
  res.locals.base = "/notes";
  res.locals.layout = "";
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
  res.locals.title = "Blot / notes";
  res.locals.body = marked(require('fs').readFileSync(notesDirectory + '/readme.txt', 'utf-8'));
  res.render("notes/layout");
});

notes.get("/:section", function(req, res) {
  res.locals.body = marked(require('fs').readFileSync(notesDirectory + '/' + req.params.section + '/readme.txt', 'utf-8'));
  res.render("notes/layout");
});

notes.get("/:section/:subsection", function(req, res) {
  res.locals.body = marked(require('fs').readFileSync(notesDirectory + '/' + req.params.section + '/' + req.params.subsection + '.txt', 'utf-8'));
  res.render("notes/layout");
});

module.exports = notes;
