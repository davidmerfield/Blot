var Template = require("template");

var NO_NAME = "Please choose a name for your new template.";
var NO_CLONE = "Please choose a template to clone.";
var SUCCESS = "Created your template succesfully!";

// How many times should we append an integer
// to the name of a new template before giving up
// and showing an error to the user?
var MAX_DEDUPLICATION_ATTEMPTS = 999;

module.exports = function(req, res, next) {
  var name = req.body.name;
  var cloneFrom = req.body.cloneFrom;
  var deduplicatingCounter = 1;
  var deduplicatedName;

  if (!name) {
    return next(new Error(NO_NAME));
  }

  if (!cloneFrom) {
    return next(new Error(NO_CLONE));
  }

  var template = {
    isPublic: false,
    name: name,
    cloneFrom: cloneFrom
  };

  Template.create(req.blog.id, name, template, function then(error) {
    if (
      error &&
      error.code === "EEXISTS" &&
      deduplicatingCounter < MAX_DEDUPLICATION_ATTEMPTS
    ) {
      // If template name was 'example', deduplicated name
      // will be first 'example 2' then 'example 3' etc...
      // We preserve the original name to ensure that we
      // don't produce 'example 2 3' or 'example 2 3 4'...
      deduplicatingCounter++;
      deduplicatedName = name + " " + deduplicatingCounter;
      template.name = deduplicatedName;
      return Template.create(req.blog.id, deduplicatedName, template, then);
    }

    if (error) {
      return next(error);
    }

    res.message("/settings/template", SUCCESS);
  });
};
