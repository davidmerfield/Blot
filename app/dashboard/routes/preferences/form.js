var helper = require('helper');
var formJSON = helper.formJSON;
var Blog = require('blog');

module.exports = function (req, res, next) {

  req.body = formJSON(req.body, Blog.scheme.TYPE);

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

  console.log('BEFORE', req.blog.plugins);
  console.log('AFTER', req.body.plugins);
  return next();
};