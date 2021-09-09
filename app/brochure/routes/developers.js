var Express = require("express");
var developers = new Express.Router();
var makeSlug = require("helper/makeSlug");
var marked = require("marked");

developers.use(function (req, res, next) {
  res.locals.base = "/templates/developers";
  next();
});

developers.get(["/reference"], function (req, res, next) {
  res.locals["show-on-this-page"] = true;

  res.locals.docs = require("yaml").parse(
    require("fs-extra").readFileSync(
      __dirname + "/../views/templates/developers/reference.yml",
      "utf-8"
    )
  );

  // Render the descriptions as markdown
  res.locals.docs.forEach((section) => {
    section.properties.forEach((property) => {
      const { description, properties } = property;

      if (description) {
        property.description = marked(description);
      }

      if (properties) {
        property.properties = properties.map((property) => {
          property.description = marked(property.description);
          return property;
        });
      }
    });
  });

  res.locals.headers = res.locals.docs.map((item) => {
    return { text: item.name, id: makeSlug(item.name) };
  });

  res.locals.headers.push({text: 'Date tokens', id: 'date-tokens'});


  // These interfere with the reference template
  // if we rename the reference template, you can
  // remove these lines
  delete res.locals.selected.reference;
  delete res.locals.selected.referenceIndex;
  next();
});

developers.get("/", function (req, res) {
  res.locals.title = "Developer guide";
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
