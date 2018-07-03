var Blog = require("blog");
var helper = require("helper");
var formJSON = helper.formJSON;

module.exports = function(req, res, next) {
  try {
    req.updates = formJSON(req.body, Blog.scheme.TYPE);
  } catch (e) {
    return next(e);
  }


  // If the user has specified a custom permalink format
  // then use it as the blog's permalink format.
  if (
    req.updates.permalink &&
    !req.updates.permalink.format &&
    req.updates.permalink.custom
  ) {
    req.updates.permalink.format = req.updates.permalink.custom;
    req.updates.permalink.isCustom = true;
  } else if (req.updates.permalink && req.updates.permalink.format) {
    req.updates.permalink.isCustom = false;
  }

  if (req.updates.plugins) {
    // this bullshit below is because I haven't properly declared
    // the model for blog.plugins so formJSON needs a little help...
    for (var i in req.updates.plugins) {
      req.updates.plugins[i].enabled = req.updates.plugins[i].enabled === "on";
      if (!req.updates.plugins[i].options) req.updates.plugins[i].options = {};
    }

    for (var x in req.updates.plugins.typeset.options)
      req.updates.plugins.typeset.options[x] =
        req.updates.plugins.typeset.options[x] === "on";

    if (req.updates.plugins.analytics.options.provider) {
      var provider = {};
      provider[req.updates.plugins.analytics.options.provider] = "selected";
      req.updates.plugins.analytics.options.provider = provider;
    }
  }
  next();
};
