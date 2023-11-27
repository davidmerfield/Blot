const _ = require("lodash");

module.exports = function (req, res, next) {
  if (req.template.locals.color_schemes) {
    let color_schemes = Object.keys(req.template.locals.color_schemes)
      .filter((key) => key !== "custom")
      .map((key) => {
        // Used to determine whether or not this color scheme is in use
        // We basically check if all the properties declared for this
        // color scheme have matching values in the template's locals
        let scheme = req.template.locals.color_schemes[key];
        let currentSchemeValues = {};

        for (let property in scheme)
          currentSchemeValues[property] = req.template.locals[property];

        return {
          key,
          label: desnake(key),
          selected: _.isEqual(scheme, currentSchemeValues),
        };
      });

    // But the custom scheme always comes first
    color_schemes.unshift({
      key: "custom",
      label: "Custom",
      selected: color_schemes.filter((i) => i.selected).length === 0,
    });

    // Makes the selected property easier to deal with in our front-end
    // template code
    color_schemes = color_schemes.map((scheme) => {
      scheme.selected = scheme.selected ? "selected" : "";
      return scheme;
    });

    res.locals.color_schemes = color_schemes;
  }

  return next();
};

function desnake(str) {
  str = str.split("_").join(" ");
  str = str[0].toUpperCase() + str.slice(1);
  return str;
}
