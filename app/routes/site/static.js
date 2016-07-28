module.exports = function(server){

  var auth = require('../../authHandler');
  var capitalise = require('../../helper').capitalise;
  var config = require('../../../config');

  // Only serve the maintenance page
  // if we are doing maintenance
  if (config.maintenance) {

    server.get('/maintenance', function(req, res){

      res.addLocals({
        partials: {yield: 'public/maintenance'},
        title: 'Maintenance'
      });

      res.render('public/_wrapper');

    });


  }

  server.get('/', auth.check, function(req, res){

    res.addLocals({
      title: 'Blot is a blogging platform',
      selected: {home: 'selected'}
    });

    res.render('public/index');
  });

  server.get('/about', auth.check, function(req, res){

    res.addLocals({
      partials: {yield: 'public/about'},
      title: 'About',
      selected: {about: 'selected'}
    });

    if (req.blog)
      res.render('dashboard/_wrapper');
    else
      res.render('public/_wrapper')
  });

  server.get('/privacy', auth.check, function(req, res){

    res.addLocals({
      partials: {yield: 'public/privacy'},
      title: 'Privacy policy',
      selected: {privacy: 'selected'}
    });

    if (req.blog)
      res.render('dashboard/_wrapper');
    else
      res.render('public/_wrapper')
  });

  server.get('/terms', auth.check, function(req, res){

    res.addLocals({
      partials: {yield: 'public/terms'},
      title: 'Terms of use',
      selected: {terms: 'selected'}
    });

    if (req.blog)
      res.render('dashboard/_wrapper');
    else
      res.render('public/_wrapper')
  });

  server.get('/contact', auth.check, function(req, res){

    res.addLocals({
      partials: {yield: 'public/contact'},
      title: 'Contact me',
      selected: {contact: 'selected'}
    });

    if (req.blog)
      res.render('dashboard/_wrapper');
    else
      res.render('public/_wrapper')
  });


};