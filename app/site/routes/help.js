module.exports = function(server){

  var help = require('../views/help/help.json');

  server.get('/help', function(req, res){
    console.log('redirecting',req.url,' to /help/' + help.sections[0].slug);
    return res.redirect('/help/' + help.sections[0].slug);
  });

  server.get('/help/:section', function(req, res){

    var sidebar = help.sidebar.slice();
    var title = 'Help';
    var section = help[req.params.section];

    sidebar = sidebar.map(function(section){

      if (section.slug === req.params.section) {
        section.selected = 'selected';
      } else {
        section.selected = ''
      }

      return section;
    });

    console.log('HERe!');

    res.addPartials({
      sidebar: 'help/sidebar'
    });

    res.setLocals({
      section: section,
      sidebar: sidebar,
      title: section.title,
      selected: {help: 'selected'},
      tab: {help: 'selected'}
    });

    console.log('rendering', req.url);
    return res.render('help/wrapper');
  });
};
