var writeToFolder = require("modules/template").writeToFolder;
var _ = require("lodash");
var eachTemplate = require("../each/template");
var Template = require("models/template");
var async = require("async");
var shouldWrite = {};

eachTemplate(
  function (user, blog, template, next) {
    var oldcontent = (" " + view.content).slice(1);

    if (view.content.indexOf("{{name}}") > -1)
      view.content = view.content.split("{{name}}").join("{{title}}");

    if (view.content.indexOf("{{{name}}}") > -1)
      view.content = view.content.split("{{{name}}}").join("{{{title}}}");

    if (oldcontent === view.content) return callback();

    process.stdout.write("\n");

    yesno.ask("Apply changes to " + view.name + "?", true, function (ok) {
      if (!ok) view.content = oldcontent;

      if (template.localEditing) shouldWrite[template.id] = blog.id;

      console.log("Changed", template.id, view.name);
      Template.setView(template.id, view, next);

      callback();
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
      callback
    );
  }
);
