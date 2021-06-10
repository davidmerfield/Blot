var writeToFolder = require("modules/template").writeToFolder;
var eachTemplate = require("../each/template");
var Template = require("models/template");
var async = require("async");
var shouldWrite = {};

eachTemplate(
  function (user, blog, template, next) {
    if (!template) return next();

    if (blog.hideDates) {
      template.locals.hide_dates = true;
    }

    template.locals.date_display = blog.dateDisplay;

    if (template.localEditing) shouldWrite[template.id] = blog.id;
    console.log("Changed", template.id);
    Template.setMetadata(template.id, template.locals, next);
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
        if (err) throw err;
        console.log("Done!");
        process.exit();
      }
    );
  }
);
