var eachView = require("../each/view");
var Template = require("template");
var mime = require("mime-types");

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

// we shouldn't need to write this change to the user's folder
// make sure this works with local templates
function main(doThis, callback) {
  eachView(function(user, blog, template, view, next) {
    if (!view || !view.content || !view.type) return next();

    if (view.type) {
      view.name = view.name + "." + mime.extension(view.type);
      delete view.type;
    }

    Template.setView(template.id, view, next);
  }, callback);
}

module.exports = main;
