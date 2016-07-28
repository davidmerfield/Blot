module.exports = function(server){

  var Entry = require('../../models/entry'),
      normalize = require('../../helper').urlNormalizer,
      plugins = require('../../plugins');

  server.use(function(request, response, next){

    var scheduled = !!request.query.scheduled;
    var blog = request.blog;
    var url = request.url;

    Entry.getByUrl(blog.id, url, function(entry){

      if (!entry) return next();

      // Eventually delete this...
      if (!entry.url) {
        console.log('MADE IT HERE WITHOUT URL');
        console.log(url);
        console.log(entry);
        return next();
      }

      // Ensure the user is always viewing
      // the entry at its latest and greatest URL, likewise
      // for search engines pass link juice!
      if (normalize(entry.url) !== normalize(url)) {
        return response.status(301).redirect(entry.url);
      }

      plugins.load('entryHTML', blog.plugins, function(err, pluginHTML){

        // Dont show plugin HTML on a page
        if (entry.menu) pluginHTML = '';

        response.addPartials({
          pluginHTML: pluginHTML
        });

        response.addLocals({
          entry: entry
        });

        response.renderView('entry', next);
      });
    }, scheduled);
  });
};