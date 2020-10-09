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
  var template, slug, name;
  var deduplicatedName, deduplicatedSlug;
  var deduplicatingCounter = 1;

  if (!req.body.name) {
    return next(new Error(NO_NAME));
  }

  if (!req.body.cloneFrom) {
    return next(new Error(NO_CLONE));
  }

  name = req.body.name.trim();

  // If this template's name was the result of existing 
  // deduplication, e.g. 'Copy of Axe 3' continue the 
  // deduplication using name 'Copy of Axe' and 
  // deduplicatingCounter of 3.
  if (name.indexOf(" ") > -1) {
    let lastWord = name.split(" ").pop();
    let lastNumber = parseInt(lastWord);
    let nameWithoutLastWord = name.slice(0, -lastWord.length).trim();

    if (!isNaN(lastNumber) && lastWord === lastNumber.toString()) {
      deduplicatingCounter = lastNumber;
      name = nameWithoutLastWord;
    }
  }

  slug = makeSlug(name.slice(0, 30));

  template = {
    isPublic: false,
    name: name,
    slug: slug,
    cloneFrom: req.body.cloneFrom,
  };

  Template.create(req.blog.id, name, template, function then(error) {
    // If template name was 'example', deduplicated name
    // will be first 'example 2' then 'example 3' etc...
    // We preserve the original name to ensure that we
    // don't produce 'example 2 3' or 'example 2 3 4'...
    if (
      error &&
      error.code === "EEXISTS" &&
      deduplicatingCounter < MAX_DEDUPLICATION_ATTEMPTS
    ) {
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
