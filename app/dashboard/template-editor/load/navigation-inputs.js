const determine_input = require("./util/determine-input");

module.exports = function (req, res, next) {
  res.locals.navigation = Object.keys(req.template.locals)

    .filter(key => key.includes("navigation_") || key.includes("_navigation"))
    .map(key => determine_input(key, req.template.locals))
    .filter(i => i);

  return next();
};
