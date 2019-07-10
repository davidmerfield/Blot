var eachView = require("../each/view");
var Template = require("template");
var async = require("async");
var shouldWrite = {};

function main(doThis, callback) {
  eachView(
    function(user, blog, template, view, next) {
      if (!template.localEditing) return next();

      if (!view) return next();

      if (view.url !== "/" + view.name) return next();

      if (["archives.html", "search.html"].indexOf(view.name) === -1) {
        console.log("nothing for", view.name);
        return next();
      }

      if (view.name === "archives.html") view.url = "/archives";
      if (view.name === "search.html") view.url = "/search";

      Template.setView(template.id, view, next);
    },
    function() {
      console.log();
      console.log("Checking to see if any templates need to be written...");
      async.eachOfSeries(
        shouldWrite,
        function(blogID, templateID, next) {
          console.log("Writing", templateID);
          Template.writeToFolder(blogID, templateID, function(err) {
            if (err) console.log(err);

            next();
          });
        },
        callback
      );
    }
  );
}

if (require.main === module) {
  main(
    function(view, callback) {
      callback();
    },
    function(err) {
      if (err) return console.error(err);

      console.log("Fixed all templates!");
      process.exit();
    }
  );
}
