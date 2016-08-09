module.exports = function(server){

  var helper = require('../../helper');
  var restrict = require('../../authHandler').enforce;
  var arrayify = helper.arrayify;
  var Redirects = require('../../models/redirects');
  var _ = require('lodash');
  var bodyParser = require('body-parser');
  var getBody = bodyParser.urlencoded({extended:false});
  var formJSON = helper.formJSON;
  var urlNormalizer = helper.urlNormalizer;

  server.get('/redirects', restrict, function(req, res){

    var blog = req.blog, blogID = blog.id;

    Redirects.list(blogID, function(err, redirects){

      res.addPartials({yield: 'dashboard/settings/redirects', sub_nav: 'dashboard/settings/_nav'});

      res.addLocals({
        title: 'Blot - Redirects',
        tab: {redirects: 'selected', settings: 'selected'},
        redirects: _.filter(redirects)
      });

      res.render('dashboard/_wrapper');
    });
  });

  function normalize (str) {

    if (str[0] !== '\\' && str[0] !== '/') {

      try {
        str = urlNormalizer(str);
      } catch (e) {}
    }

    return str;
  }

  server.post('/redirects', restrict, getBody, function(req, res){

    var mappings = formJSON(req.body, {redirects: 'object'});

    mappings = arrayify(mappings.redirects);

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

      if (err) console.log(err);

      return res.redirect('/redirects');
    });
  });
};