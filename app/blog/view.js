const { getViewByURL } = require("models/template");

module.exports = function (req, res, next) {
  const template = req?.blog?.template;

  if (!template) return next();

  // If you don't decode the URL here, you'll see issues
  // with URLs containing special characters e.g. %20 or %2F
  // We intentionally do minimal processing in getViewsByURL
  const url = decodeURIComponent(req.url);

  getViewByURL(template, url, function (err, viewName, params) {
    if (err) return next(err);

    if (!viewName) return next();

    if (params) {
      req.params = params;
      res.locals.params = params;
    }

    // we expose the query string object parsed by express
    res.locals.query = req.query;

    return res.renderView(viewName, next);
  });
};
