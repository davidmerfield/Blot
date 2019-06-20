var matter = require("gray-matter");
var Express = require("express");
var acknowledgements = new Express.Router();
var fs = require("fs-extra");

function loadContributors(req, res, next) {
  fs.readFile(
    __dirname + "/../views/acknowledgements/dependencies.yaml",
    "utf-8",
    function(err, contents) {
      if (err) return next(err);

      var dependencies = matter("---\n" + contents + "\n---").data;
      var contributors = [];

      dependencies.forEach(function(dependency) {
        contributors = contributors.concat(dependency.contributors);
      });

      dependencies[dependencies.length - 1].last = true;
      contributors[contributors.length - 1].last = true;

      res.locals.dependencies = dependencies;
      res.locals.contributors = uniqueBy("name", contributors);

      next();
    }
  );
}

acknowledgements.get("/", loadContributors, function(req, res) {
  res.locals.title = "Blot - Acknowledgements";
  res.render("acknowledgements");
});

function uniqueBy(property, list) {
  var seen = {};

  list = list.filter(function(item) {
    if (seen[item[property]]) return false;
    seen[item[property]] = true;
    return true;
  });

  return list;
}

module.exports = acknowledgements;
