var helper = require('helper');
var formJSON = helper.formJSON;
var Blog = require('blog');

module.exports = function (req, res, next) {

  req.body = formJSON(req.body, Blog.scheme.TYPE);

  // If the user has specified a custom permalink format
  // then use it as the blog's permalink format.
  if (!req.body.permalink.format && req.body.permalink.custom)
    req.body.permalink.format = req.body.permalink.custom;

  // this bullshit below is because I haven't properly declared
  // the model for blog.plugins so formJSON needs a little help...
  for (var i in req.body.plugins) {
    req.body.plugins[i].enabled = req.body.plugins[i].enabled === 'on';
    if (!req.body.plugins[i].options) req.body.plugins[i].options = {};
  }

  for (var x in req.body.plugins.typeset.options)
    req.body.plugins.typeset.options[x] = req.body.plugins.typeset.options[x] === 'on';

  if (req.body.plugins.analytics.options.provider) {
    var provider = {};
    provider[req.body.plugins.analytics.options.provider] = 'selected';
    req.body.plugins.analytics.options.provider = provider;
  }

  return next();
};