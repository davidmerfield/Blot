var eachTemplate = require("../each/template");
var writeToFolder = require("models/template").writeToFolder;
var Template = require("models/template");
var async = require("async");
var shouldWrite = {};

eachTemplate(
  function (user, blog, template, next) {
    if (!template) return next();

    let hide_dates = blog.hideDates === true;
    let date_display = blog.dateDisplay;
    let changes = false;

    if (hide_dates !== template.locals.hide_dates) {
      template.locals.hide_dates = hide_dates;
      changes = true;
    }

    if (date_display !== template.locals.date_display) {
      template.locals.date_display = blog.dateDisplay;
      changes = true;
    }

    if (changes) {
      console.log("Changed", template.id);
      if (template.localEditing) shouldWrite[template.id] = blog.id;

      Template.setMetadata(template.id, { locals: template.locals }, next);
    } else {
      next();
    }
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
