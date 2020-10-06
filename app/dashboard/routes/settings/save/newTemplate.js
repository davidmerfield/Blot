var Template = require("template");
var makeSlug = require("helper").makeSlug;

var NO_NAME = "Please choose a name for your new template.";
var NO_CLONE = "Please choose a template to clone.";
var SUCCESS = "Created your template succesfully!";

// How many times should we append an integer
// to the name of a new template before giving up
// and showing an error to the user?
var MAX_DEDUPLICATION_ATTEMPTS = 999;

module.exports = function (req, res, next) {
  var cloneFrom = req.body.cloneFrom;
  var name = req.body.name;
  var deduplicatingCounter = 1;
  var deduplicatedName, deduplicatedSlug;

  if (!name) {
    return next(new Error(NO_NAME));
  }

  if (!cloneFrom) {
    return next(new Error(NO_CLONE));
  }

  // let's say the name is 'Copy of Forst 2'
  // deduplicatingCounter -> 2
  // name -> Copy of Forst
  if (parseInt(name.split(" ").pop()).toString() === name.split(" ").pop()) {
    deduplicatingCounter = parseInt(name.split(" ").pop());
    name = name.split(" ").slice(0, -1).join(" ");
  }

  var slug = makeSlug(name.slice(0, 30));


  var template = {
    isPublic: false,
    name: name,
    slug: slug,
    cloneFrom: cloneFrom,
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
      deduplicatedSlug = slug + "-" + deduplicatingCounter;
      template.name = deduplicatedName;
      template.slug = deduplicatedSlug;
      return Template.create(req.blog.id, deduplicatedName, template, then);
    }

    if (error) {
      return next(error);
    }

    res.message("/settings/template", SUCCESS);
  });
};
