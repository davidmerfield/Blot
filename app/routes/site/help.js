module.exports = function(server){

  var auth = require('../../authHandler'),
      fs = require('fs'),
      config = require('../../../config'),
      _ = require('lodash'),
      mustache = require('mustache'),
      helper = require('../../helper'),
      arrayify = helper.arrayify,
      HELP = '/../../views/help/help.json',
      HELP_FILE = __dirname + HELP;

  var json,
      slugIndex = {};

  function fetchJSON () {

    var parse = JSON.parse;
    var read = fs.readFileSync;

    json = parse(read(HELP_FILE, 'utf-8'));

    for (var i in json) {
      var slug = json[i].slug;
      slugIndex[slug] = i;
    }
  }

  fetchJSON();

  server.get('/help', auth.check, function(request, response){

    if (config.environment === 'development')
      fetchJSON();

    var helpJSON = _.cloneDeep(json);
    var sidebar = _.cloneDeep(helpJSON);

    // We use set locals rather
    // than add locals since
    // we need to overwrite existing
    // partials...
    response.setLocals({
      title: 'Blot - Help',
      selected: {help: 'selected'},
      tab: {help: 'selected'},
      sidebar: arrayify(sidebar),
      sections: arrayify(helpJSON),
      partials: {
        yield: 'help/overview',
      }
    });

    if (request.blog)
      response.render('dashboard/_wrapper');
    else
      response.render('help/wrapper');
  });

  server.get('/help/:section', auth.check, function(request, response){

    if (config.environment === 'development')
      fetchJSON();

    var helpJSON = _.cloneDeep(json);

    var sectionID = slugIndex[request.params.section];
    var section = helpJSON[sectionID];

    var sidebar = _.cloneDeep(helpJSON);
        sidebar[sectionID].isCurrent = 'selected';

    var locals = {
      title: 'Blot - Help - ' + section.title,
      selected: {help: 'selected'},
      tab: {help: 'selected'},
      section: section,
      sidebar: arrayify(sidebar),
      partials: {
        yield: 'help/section'
      }
    };

    section.html = mustache.render(section.html, locals);

    // We use set locals rather
    // than add locals since
    // we need to overwrite existing
    // partials...
    response.setLocals(locals);

    if (request.blog)
      response.render('dashboard/_wrapper');
    else
      response.render('help/wrapper');
  });

};