var Blog = require("models/blog");
var formJSON = require("helper/formJSON");
var extend = require("helper/extend");

module.exports = function (req, res, next) {
  try {
    req.updates = formJSON(req.body, Blog.scheme.TYPE);
  } catch (e) {
    return next(e);
  }

  if (req.body.hasMenu) {
    req.updates.menu = req.updates.menu || [];

    for (var i in req.updates.menu) {
      for (var x in req.blog.menu) {
        if (req.blog.menu[x].id === req.updates.menu[i].id) {
          extend(req.updates.menu[i]).and(req.blog.menu[x]);
        }
      }

      let linkURL = req.updates.menu[i].url;

      // Turns 'wikipedia.org/david' into 'https://wikipedia.org/david'
      if (
        linkURL.indexOf("/") > -1 &&
        !linkURL.startsWith("/") &&
        !linkURL.startsWith("http://") &&
        !linkURL.startsWith("https://") &&
        linkURL.slice(0, linkURL.indexOf("/")).indexOf('.') > -1        
      ) {
        req.updates.menu[i].url = "https://" + req.updates.menu[i].url;
      }
    }
  }


  if (req.updates.plugins) {
    // this bullshit below is because I haven't properly declared
    // the model for blog.plugins so formJSON needs a little help...
    for (var i in req.updates.plugins) {
      req.updates.plugins[i].enabled = req.updates.plugins[i].enabled === "on";
      if (!req.updates.plugins[i].options) req.updates.plugins[i].options = {};
    }

    if (req.updates.plugins.typeset) {
      for (var x in req.updates.plugins.typeset.options)
        req.updates.plugins.typeset.options[x] =
          req.updates.plugins.typeset.options[x] === "on";
    }

    extend(req.updates.plugins).and(req.blog.plugins);

    // We mpdify the analytics settings after the extend function because
    // the extend function will not overwrite existing conflicting providers
    // it'll produce {Google: 'selected', Clicky: 'selected'}...
    if (
      req.updates.plugins.analytics &&
      req.updates.plugins.analytics.options.provider
    ) {
      var provider = {};
      provider[req.updates.plugins.analytics.options.provider] = "selected";
      req.updates.plugins.analytics.options.provider = provider;
    }
  }
  next();
};
