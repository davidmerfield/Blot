const { writeToFolder } = require("models/template");
const eachTemplate = require("../each/template");
const Template = require("models/template");
const async = require("async");
const yesno = require("yesno");
const _ = require("lodash");
const fonts = require("blog/static/fonts/index.json");

const shouldWrite = {};

eachTemplate(
  function (user, blog, template, next) {
    if (JSON.stringify(template).toLowerCase().indexOf("woff2") === -1)
      return next();

    const locals = template.locals;
    const localsCopy = _.cloneDeep(locals);

    // walk through each property of the template
    // and check if its a string containing woff2
    // if it is, ask the user if they want to change it
    const fontKeys = Object.keys(locals).filter((key) => key.endsWith("_font"));

    fontKeys.forEach((key) => {
      const currentFont = locals[key];

      if (currentFont.styles.indexOf("woff2") === -1) return;

      const latestFont = fonts.find((f) => f.name === currentFont.name);

      if (!latestFont) {
        console.error("Cannot update font", currentFont.name);
      } else {
        console.log("Updating font", currentFont.name);
        currentFont.styles = latestFont.styles;
      }
    });

    if (_.isEqual(localsCopy, locals)) return next();

    yesno.ask("Apply changes to " + template.id + "?", true, function (ok) {
      if (template.localEditing) shouldWrite[template.id] = blog.id;

      console.log("Changed", template.id);
      Template.setMetadata(template.id, { locals }, next);
    });
  },
  function () {
    console.log();
    console.log("Checking to see if any templates need to be written...");
    async.eachOfSeries(
      shouldWrite,
      function (blogID, templateID, next) {
        console.log("Writing", templateID);
        writeToFolder(blogID, templateID, function (err) {
          if (err) console.log(err);
          next();
        });
      },
      function(err) {
        if (err) console.error(err);
        console.log("Done!");
        process.exit();
      }
    );
  }
);
