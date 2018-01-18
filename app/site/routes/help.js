module.exports = function(server){

  var help = require('../views/help/help.json');
  var config = require('config');
  var fs = require('fs');

  server.get('/help', function(req, res){
    console.log('redirecting',req.url,' to /help/' + help.sections[0].slug);
    return res.redirect('/help/' + help.sections[0].slug);
  });

  server.get('/help/:section', function(req, res){

    // Reload the view in development mode for each request.
    if (config.environment === 'development') {
      console.log('reloading help');
      help = JSON.parse(fs.readFileSync(__dirname + '/../views/help/help.json'));
    }

    var sidebar = help.sidebar.slice();
    var section = help[req.params.section];

    sidebar = sidebar.map(function(section){

      if (section.slug === req.params.section) {
        section.selected = 'selected';
      } else {
        section.selected = '';
      }

      return section;
    });

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

    return res.render('help/wrapper');
  });
};
