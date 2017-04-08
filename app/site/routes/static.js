module.exports = function(server){

  var config = require('config');

  server.get('/maintenance', function(req, res){

    res.addLocals({
      partials: {yield: 'maintenance'},
      title: 'Maintenance'
    });

    res.render('_wrapper');
  });

  server.get('/', function(req, res){

    res.addLocals({
      title: 'Blot is a blogging platform',
      selected: {home: 'selected'}
    });

    res.render('index');
  });

  server.get('/about', function(req, res){

    res.addLocals({
      partials: {yield: 'about'},
      title: 'About',
      selected: {about: 'selected'}
    });

    res.render('_wrapper');
  });

  server.get('/privacy', function(req, res){

    res.addLocals({
      partials: {yield: 'privacy'},
      title: 'Privacy policy',
      selected: {privacy: 'selected'}
    });

    res.render('_wrapper')
  });

  server.get('/terms', function(req, res){

    res.addLocals({
      partials: {yield: 'terms'},
      title: 'Terms of use',
      selected: {terms: 'selected'}
    });

    res.render('_wrapper');
  });

  server.get('/contact', function(req, res){

    res.addLocals({
      partials: {yield: 'contact'},
      title: 'Contact me',
      selected: {contact: 'selected'}
    });

    res.render('_wrapper')
  });


};