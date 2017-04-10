var rebuild = require('../../../rebuild');

var Blog = require('blog');
var resaveEntries = require('./resaveEntries');
var loadPlugins = require('./loadPlugins');
var loadTimeZones = require('./loadTimeZones');
var loadRedirects = require('./loadRedirects');

var saveRedirects = require('./saveRedirects');
var form = require('./form');

module.exports = function(server) {

  require('./404s')(server);

  server.route('/preferences')

    .get(loadPlugins, loadTimeZones, loadRedirects)

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

        if (changes.indexOf('timeZone') > -1 ||
            changes.indexOf('dateDisplay') > -1) {
          resaveEntries(blogID, function(){
            //
          });
        }

        if (changes && changes.length)
          res.message({success: 'Made changes successfully!'});

        if (changes && changes.indexOf('plugins') > -1)
          rebuild(blog.id);

        res.redirect(req.path);
      });
    });
};