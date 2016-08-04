module.exports = function(server){

  var Entry = require('../../models/entry'),
      normalize = require('../../helper').urlNormalizer,
      plugins = require('../../plugins');

  var Entries = require('../../models/entries');

  server.use(function(request, response, next){

    var scheduled = !!request.query.scheduled;
    var blog = request.blog;

    // we use request.path as opposed to request.url
    // because we don't care about the query string.
    // perhaps entry.getByURL should be responsible
    // for stripping the query string?
    var url = request.path;

    // remove trailing slash
    if (url.slice(-1) === '/')
      url = url.slice(0, -1);

    // add leading slash
    if (url[0] !== '/')
      url = '/' + url;

    url = decodeURIComponent(url);
    url = url.toLowerCase();

    Entry.getByUrl(blog.id, url, function(entry){

      if (!entry || entry.deleted || entry.draft)
        return next();

      if (entry.scheduled && !scheduled)
        return next();

      Entries.adjacentTo(blog.id, entry.id, function(nextEntry, previousEntry){

        entry.next = nextEntry;
        entry.previous = previousEntry;
        entry.adjacent = !!(nextEntry || previousEntry);

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
      });
    });
  });
};