var rebuild = require('../../../rebuild');

var Blog = require('blog');
var resaveEntries = require('./resaveEntries');

var loadPermalinkFormats = require('./loadPermalinkFormats');
var loadPlugins = require('./loadPlugins');
var loadTimeZones = require('./loadTimeZones');
var loadRedirects = require('./loadRedirects');

var saveRedirects = require('./saveRedirects');
var form = require('./form');

module.exports = function(server) {

  require('./404s')(server);

  server.route('/preferences')

    .get(loadPlugins, loadTimeZones, loadRedirects, loadPermalinkFormats)

    .get(function(req, res){
      // console.log(req.blog.plugins);
      res.title('Preferences');
      res.renderDashboard('preferences');
    })

    .post(saveRedirects, form, function(req, res, next){

      var blog = req.blog;
      var blogID = blog.id;
      var updates = req.body;

      Blog.set(blogID, updates, function(err, changes){

        if (err) return next(err);

        if (changes && changes.length)
          res.message({success: 'Made changes successfully!'});

        // We now need to save every entry so that
        // changes to permalink format take effect.
        if (changes.indexOf('timeZone') > -1 ||
            changes.indexOf('dateDisplay') > -1 ||
            changes.indexOf('permalink') > -1) {
          resaveEntries(blogID, function(){});
        }

        // We need to build all the blog's entries if the user
        // has changed any of the plugins or their permalink
        // format. This should be improved but we.
        if (changes && (changes.indexOf('plugins') > -1)) {
          rebuild(blog.id);
        }

        res.redirect(req.path);
      });
    });
};