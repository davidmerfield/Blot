var Template = require("../../app/models/template");
var async = require("async");

Template.read.all("SITE", __dirname + "/../../app/templates", function(
  err,
  templates
) {
  async.each(
    templates,
    function(template, next) {
      Template.update(template.id, { isPublic: true }, next);
    },
    function(err) {
      if (err) throw err;
      console.log("BUILT!");
    }
  );
});
