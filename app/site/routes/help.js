module.exports = function(server){


  server.get('/help', function(req, res){

    console.log('HERE');

    res.setLocals({
      title: 'Blot - Help',
      selected: {help: 'selected'},
      tab: {help: 'selected'},
    });

    res.addPartials({yield: 'help/overview'});

    if (req.blog)
      return res.render('help/wrapper');

    res.render('help/wrapper');
  });

  server.get('/help/:section', function(req, res){

    res.addPartials({
      yield: 'help/sections/' + req.params.section,
      sidebar: 'help/sidebar'
    });

    res.setLocals({
      sidebar: true,
      title: 'Blot - Help - ' + req.params.section,
      selected: {help: 'selected'},
      tab: {help: 'selected'}
    });

    if (req.blog)
      return res.render('help/wrapper');

    res.render('help/wrapper');
  });

  server.use('/help', function(err, req, res, next){

    console.log(req.url, err.message);

    return res.redirect('/help');
  });
};