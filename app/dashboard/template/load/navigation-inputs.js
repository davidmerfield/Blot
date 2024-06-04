const determine_input = require("./util/determine-input");

const MAP = {
  navigation_alignment: {
    label: "Align"
  },
  navigation_location: {
    label: "Position"
  }
};

module.exports = function (req, res, next) {
  res.locals.navigation = Object.keys(req.template.locals)

    .filter(key => key.includes("navigation_") || key.includes("_navigation"))
    .map(key => determine_input(key, req.template.locals, MAP))
    .filter(i => i);

  return next();
};
