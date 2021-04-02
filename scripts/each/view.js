var eachTemplate = require("./template");
var Template = require("models/template");
var async = require("async");

module.exports = function (doThis, callback) {
  eachTemplate(function (user, blog, template, nextTemplate) {
    Template.getAllViews(template.id, function (err, views) {
      if (err) throw err;

      async.eachOfSeries(
        views,
        function (view, name, nextView) {
          doThis(user, blog, template, view, nextView);
        },
        nextTemplate
      );
    });
  }, callback);
};
