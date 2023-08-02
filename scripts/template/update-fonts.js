// If we change any of the fonts, e.g. their CSS styles or their font stack,
// we need to update the template metadata to reflect that.

const { writeToFolder } = require("models/template");
const eachTemplate = require("../each/template");
const Template = require("models/template");
const async = require("async");
const _ = require("lodash");
const fonts = require("blog/static/fonts/index.json");
const flushCache = require("models/blog/flushCache");

const shouldWrite = {};

eachTemplate(
  function (user, blog, template, next) {
    const locals = template.locals;
    const localsCopy = _.cloneDeep(locals);

    const fontKeys = Object.keys(locals).filter((key) => key.endsWith("_font"));

    fontKeys.forEach((key) => {
      const currentFont = locals[key];
      const latestFont = fonts.find((f) => f.id === currentFont.id);

      if (!latestFont) {
        console.warn(
          template.id,
          "'" + currentFont.name + "' cannot be updated"
        );
      } else if (
        !_.isEqual(currentFont.styles, latestFont.styles) ||
        !_.isEqual(currentFont.stack, latestFont.stack)
      ) {
        console.log(template.id, "'" + currentFont.name + "' will be updated");
        currentFont.styles = latestFont.styles;
        currentFont.stack = latestFont.stack;
      } else {
        console.log(template.id, "'" + currentFont.name + "' is up to date");
      }
    });

    if (_.isEqual(localsCopy, locals)) return next();

    if (template.localEditing) shouldWrite[template.id] = blog.id;

    console.log("Saving changes to", template.id);
    console.log();
    Template.setMetadata(template.id, { locals }, function (err) {
      if (err) return next(err);
      flushCache(blog.id, next);
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
      function (err) {
        if (err) console.error(err);
        console.log("Done!");
        process.exit();
      }
    );
  }
);
