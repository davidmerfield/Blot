module.exports = function(server){

  server.get('/help', function(req, res){

    res.setLocals({
      title: 'Help',
      selected: {help: 'selected'},
      tab: {help: 'selected'},
    });

    res.addPartials({yield: 'help/overview'});

    if (req.blog)
      return res.render('help/wrapper');

    res.render('help/wrapper');
  });

  function capitalize (str) {
    return str[0].toUpperCase() + str.slice(1);
  }

  function deslug (slug) {
    return capitalize(slug.split('-').join(' '));
  }

  server.get('/help/:section', function(req, res){

    res.addPartials({
      yield: 'help/sections/' + req.params.section,
      sidebar: 'help/sidebar'
    });

    res.setLocals({
      subsection: true,
      title: deslug(req.params.section),
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
