var rebuild = require('../../../rebuild');

var helper = require('helper'),
    capitalise = helper.capitalise,
    deCamelize = helper.deCamelize,
    auth = require('authHandler'),
    Mustache = require('mustache'),
    _ = require('lodash'),
    Blog = require('blog'),
    bodyParser = require('body-parser'),
    type = helper.type,
    pluginList = require('../../../plugins').list;

var Transformer = require('../../../transformer');

module.exports = function(server) {

  server.get('/apps',function(req, res){return res.redirect('/plugins');});

  server
    .route('/rebuild-thumbnails')
    .all(auth.enforce)
    .get(function(req, res){
      res.render('dashboard/rebuild-thumbnails');
    })
    .post(function(req, res){

      var imageCache = new Transformer(req.blog.id, 'image-cache');
      var thumbnails = new Transformer(req.blog.id, 'thumbnails');


      console.log('Flushing image cache for', req.blog.handle);

      imageCache.flush(function(){
        console.log('Flushed imageCache for', req.blog.handle);
        console.log('Flushing thumbnails for', req.blog.handle);

        thumbnails.flush(function(){

          console.log('Flushed thumbnails for', req.blog.handle);
          rebuild(req.blog.id);
          res.redirect(req.url);
        });
      });
    });

  function loadPlugins (category) {

    return function (req, res, next) {

      var blog = req.blog;

      var plugins = _.cloneDeep(pluginList);

      for (var i in plugins) {

        // should not be able to disable this plugin...
        // MUST BE CLONED >.>
        if (!plugins[i].optional) {
          delete plugins[i];
          continue;
        }

        if (!blog.plugins[i]){
          console.log('Plugin not found: ' + i);
          continue;
        }

        var formHTML = plugins[i].formHTML;
        var options = blog.plugins[i].options;

        if (plugins[i].formHTML)
          plugins[i].formHTML = Mustache.render(formHTML, options);

        if (blog.plugins[i] && blog.plugins[i].enabled)
          plugins[i].checked = 'checked';
      }

      var categories = {};

      var change = {
        External: 'External services'
      };

      plugins = helper.arrayify(plugins, function(plugin){

        var name = capitalise(deCamelize(plugin.category || 'general'));
        var slug = name.split(' ').join('-').toLowerCase();

        if (change[name])
          name = change[name];

        categories[name] = categories[name] || {
          name: name,
          plugins: [],
          slug: slug,
          url: '/plugins/' + slug,
          selected: slug === category ? 'selected' : ''
        };

        if (categories[name].plugins.length % 3 === 0) {
          plugin.clear = true;
        }

        categories[name].plugins.push(plugin);
      });

      categories = helper.arrayify(categories);

      var _categories = categories.slice();
          categories = [];

      for (var x in _categories) {
        if (_categories[x].slug === 'typography') {
          categories.unshift(_categories[x]);
        } else {
          categories.push(_categories[x]);
        }
      }

      res.addPartials({sub_nav: 'dashboard/settings/_nav'});
      res.addLocals({categories: categories});

      plugins = categories.filter(function(item){
        return item.slug === category;
      });

      plugins = plugins[0].plugins;

      var tab = {settings: 'selected'};

      tab[category] = 'selected';

      res.addLocals({
        title: 'Blot - Plugins',
        plugins: plugins,
        tab: tab
      });

      res.addPartials({
        yield: 'dashboard/settings/plugin'
      });

      res.render('dashboard/_wrapper');
    }
  }

  server.get('/settings/typography', auth.enforce, loadPlugins('typography'));
  server.get('/settings/images', auth.enforce, loadPlugins('images'));
  server.get('/settings/add-ons', auth.enforce, loadPlugins('external'));

  /// Post files
  server.post('/settings/add-ons', auth.enforce, bodyParser.urlencoded({extended:false}), savePlugins);
  server.post('/settings/images', auth.enforce, bodyParser.urlencoded({extended:false}), savePlugins);
  server.post('/settings/typography', auth.enforce, bodyParser.urlencoded({extended:false}), savePlugins);

  function savePlugins (request, response){

      var blog = request.blog,
          blogID = blog.id;

      var newPlugins = blog.plugins;

      // enablede or disable checkboxes
      for (var x in pluginList) {

        var id = pluginList[x].id;

        if (pluginList[x].optional === false) {
          newPlugins[id].enabled = true;
        } else if (request.body[id] && request.body[id] === 'off') {
          newPlugins[id].enabled = false;
        } else if (request.body[id] && request.body[id] !== 'off') {
          newPlugins[id].enabled = true;
        }
      }

      var selectSuffix = '[select]';

      for (var i in request.body) {

        // Is a plugin subfield (for options)
        if (i.indexOf('.') > -1 &&  newPlugins[i.slice(0, i.indexOf('.'))]) {

          var pluginName = i.slice(0, i.indexOf('.'));
          var pluginField = i.slice(i.indexOf('.')+1);

          // Handle checkboxes
          if (type(pluginList[pluginName].options[pluginField], 'boolean')) {

            if (_.isEqual(request.body[i], ['false', 'on'])) {
              request.body[i] = true;
            }

            if (request.body[i] === 'false') {
              request.body[i] = false;
            }
          }

          // Is not a select box
          if (pluginField.slice(-selectSuffix.length) !== selectSuffix) {
            newPlugins[pluginName].options[pluginField] = request.body[i];
          }

          // Is a select box
          if (pluginField.slice(-selectSuffix.length) === selectSuffix) {

            pluginField = pluginField.slice(0, -selectSuffix.length);

            newPlugins[pluginName].options[pluginField] = {};
            newPlugins[pluginName].options[pluginField][request.body[i]] = 'selected';
          }
        }
      }

      Blog.set(blogID, {plugins: newPlugins}, function(err, changes){

        if (err)
          response.message({errors: err});

        if (changes && changes.length)
          response.message({success: 'Made changes successfully!'});

        if (changes && changes.indexOf('plugins') > -1)
          rebuild(blog.id);

        response.redirect(request.path);
      });
    }
};