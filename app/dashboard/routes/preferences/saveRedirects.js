var helper = require('helper');
var arrayify = helper.arrayify;
var Redirects = require('../../../models/redirects');
var formJSON = helper.formJSON;
var urlNormalizer = helper.urlNormalizer;

function normalize (str) {

  if (str[0] !== '\\' && str[0] !== '/') {

    try {
      str = urlNormalizer(str);
    } catch (e) {}
  }

  return str;
}

module.exports = function (req, res, next) {

  var mappings = {};

  if (req.body.redirects) {

    mappings = req.body.redirects.split('\n');
    mappings = mappings.map(function(line){
      from = line.slice(0, line.indexOf(' '));
      to = line.slice(line.indexOf(' '));
      return {from: from, to: to}
    });

    delete req.body.redirects;

  } else {
    mappings = formJSON(req.body, {redirects: 'object'});
    mappings = arrayify(mappings.redirects);
  }


  // Because the page has an empty redirect
  // to use as a template, we need to filter
  // it first before checking...
  mappings = mappings.filter(function(mapping){
    return !!mapping.from && !!mapping.to;
  });

  // Ensure mappings have a leading slash
  // or are regexes
  mappings = mappings.map(function(mapping){

    mapping.from = normalize(mapping.from);
    mapping.to = normalize(mapping.to);

    return mapping;
  });

  Redirects.set(req.blog.id, mappings, function(err){

    return next(err);
  });
}