module.exports = function(server){

  var helper = require('../../helper');
  var restrict = require('../../authHandler').enforce;
  var arrayify = helper.arrayify;
  var Redirects = require('../../models/redirects');
  var _ = require('lodash');
  var bodyParser = require('body-parser');
  var getBody = bodyParser.urlencoded({extended:false});
  var formJSON = helper.formJSON;

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

  server.post('/redirects', restrict, getBody, function(req, res){

    console.log(req.body);

    var mappings = formJSON(req.body, {redirects: 'object'});


    console.log(mappings);

    mappings = arrayify(mappings.redirects);

    console.log(mappings);

    Redirects.set(req.blog.id, mappings, function(err){

      if (err) console.log(err);

      return res.redirect('/redirects');
    });
  });
};