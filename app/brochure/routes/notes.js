var Express = require("express");
var notes = new Express.Router();
var marked = require("marked");
const fs = require("fs");
const NOTES_DIRECTORY = require("helper").rootDir + "/notes";
const path = require("path");

const removeIgnorableItems = name => name[0] !== "." && name[0] !== "_";

const extractName = filePath =>
  fs.readFileSync(filePath, "utf-8").split("# ")[0];

const withoutExtension = name => path.parse("/" + name).name;

notes.use(function(req, res, next) {
  res.locals.base = "/notes";
  res.locals.layout = "";
  res.locals.selected = {};
  next();
});

notes.param("section", function(req, res, next) {
  res.locals.selected[req.params.section] = "selected";
  res.locals.toc = fs
    .readdirSync(NOTES_DIRECTORY)
    .filter(removeIgnorableItems)
    .map(section => {
      return {
        name: section,
        items: fs
          .readdirSync(NOTES_DIRECTORY + "/" + section)
          .filter(removeIgnorableItems)
          .map(article => {
            return {
              name: extractName(
                NOTES_DIRECTORY + "/" + section + "/" + article
              ),
              slug:
                "/notes/" +
                withoutExtension(section) +
                "/" +
                withoutExtension(article)
            };
          }),
        slug: "/notes/" + path.parse("/" + section).name
      };
    });
  res.locals.section = "/notes/" + req.params.section;
  next();
});

notes.param("article", function(req, res, next) {
  res.locals.selected[req.params.article] = "selected";
  next();
});

notes.get("/", function(req, res, next) {
  res.locals.title = "Notes - Blot";
  next();
});

notes.get("/:section/:article", function(req, res, next) {
  res.locals.body = marked(
    require("fs").readFileSync(
      NOTES_DIRECTORY +
        "/" +
        req.params.section +
        "/" +
        req.params.article +
        ".txt",
      "utf-8"
    )
  );
  next();
});

notes.get(["/", "/:section/:article", "/:section"], function(req, res) {
  res.render("notes/layout");
});
module.exports = notes;
