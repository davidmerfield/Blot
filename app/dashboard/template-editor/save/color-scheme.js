const _ = require("lodash");

module.exports = function (req, res, next) {
  // the user has not clicked on a button in the 'color scheme' list
  if (!req.locals.color_scheme) return next();

  // the user's template does not have any color schemes
  if (!req.template.locals.color_schemes) return next();

  let newTheme = req.locals.color_scheme;

  // the user's template does not a color scheme matching the
  // name of the color scheme whose button they just pressed
  if (!req.template.locals.color_schemes[newTheme]) return next();

  let oldState = {};
  let newState = {};

  for (let property in req.template.locals.color_schemes[newTheme]) {
    newState[property] = req.template.locals.color_schemes[newTheme][property];
    oldState[property] = req.template.locals[property];
  }

  // reset memory of custom scheme
  if (newTheme === "custom") {
    req.locals.color_schemes.custom = {};
  }

  // The previous state did not correspond to one of the color
  // scheme options for this template
  let oldStateWasNotTheme =
    Object.keys(req.template.locals.color_schemes).filter((color_scheme) =>
      _.isEqual(req.template.locals.color_schemes[color_scheme], oldState)
    ).length === 0;

  // Store the old values affected by the color scheme in the custom field
  // in case the user wants to switch back to them.
  if (oldStateWasNotTheme) {
    req.locals.color_schemes.custom =
      req.template.locals.color_schemes.custom || {};
    req.locals.color_schemes.custom = oldState;
  }

  // Set new state of color scheme to be saved in the DB
  for (let property in newState) req.locals[property] = newState[property];

  // remove the local created by the web template editor to
  // trigger this middlware
  delete req.locals.color_scheme;

  next();
};
