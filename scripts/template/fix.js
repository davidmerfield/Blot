var writeToFolder = require("../../app/modules/template").writeToFolder;
var _ = require("lodash");

var eachView = require("../each/view");
var Template = require("../../app/models/template");
var helper = require("helper");
var type = helper.type;
var async = require("async");
var changedTemplates = {};

if (require.main === module) {
  main(function(err) {
    if (err) return console.error(err);

    console.log("Fixed all templates!");
    process.exit();
  });
}

function main(callback) {
  eachView(
    function(user, blog, template, view, next) {
      if (!view || !view.content) return next();

      var _view = _.cloneDeep(view);

      // if (view.content.indexOf('') > -1) view.content = ...;
      
      if (_.isEqual(_view, view)) return next();

      changedTemplates[template.id] = blog.id;
      console.log("Changed", template.id);
      Template.setView(template.id, view, next);
    },
    function() {
      console.log("Checking to see if any templates need to be written...");
      async.eachOf(
        changedTemplates,
        function(blogID, templateID, next) {
          console.log("Writing", templateID);
          writeToFolder(blogID, templateID, next);
        },
        callback
      );
    }
  );
}
