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

        // Ensure the user is always viewing
        // the entry at its latest and greatest URL
        // 301 passes link juice for SEO?
        if (entry.url && normalize(entry.url) !== normalize(url)) {

          // Res.direct expects a URL, we shouldnt need
          // to do this now but OK. I feel like we're decoding
          // then recoding then decoding. I should just store
          // valid URI and skip the decoding.
          var redirect = encodeURI(entry.url);

          return response.status(301).redirect(redirect);
        }

        plugins.load('entryHTML', blog.plugins, function(err, pluginHTML){

          // Dont show plugin HTML on a page or a draft.
          // Don't show plugin HTML on a preview subdomain.
          // This is to prevent Disqus getting stuck on one URL.
          if (entry.menu || entry.draft || request.previewSubdomain) {
            pluginHTML = '';
          }

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