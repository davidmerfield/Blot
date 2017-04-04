var models = require('models');
var Template = models.template;
var Blog = models.blog;
var load_templates = require('../middleware/load_templates');

module.exports = function (server) {

  server.use('/settings/design', load_templates, function(req, res, next){

    res.locals.partials.sub_nav = 'dashboard/design/_nav';

    next();
  });

  server.route('/settings/design')

    .get(function (req, res) {

      res.locals.title = 'Design';
      res.locals.active = ['design', 'select'];

      res.wrapper('dashboard/settings/design');
    })

    .post(function(req, res, next){

      var templateID = req.body.template;

      // Blog selected a new template
      if (templateID && templateID === req.blog.template)
        return res.redirect(req.path);

      Template.getMetadata(templateID, function(err, template){

        if (err || !template)
          return next('That template does not exist.');

        Blog.set(req.blog.id, {template: templateID}, function (errors) {

          if (errors && errors.template)
            return next(errors.template);

          res.message({success: 'Changed your template to ' + template.name});
          res.redirect(req.path);
        });
      });
    });

  server.route('/settings/design/new')

    .get(function(req, res){

      res.locals.title = 'New template';
      res.locals.active = ['design', 'new'];

      res.wrapper('dashboard/settings/new-design');
    })

    .post(function(req, res, next){

      var name = req.body.name;
      var cloneFrom = req.body.cloneFrom;

      if (!name)
        return next('Please choose a name for your new template.');

      if (!cloneFrom)
        return next('Please choose a template to clone.');

      var template = {
        isPublic: false,
        name: name,
        cloneFrom: cloneFrom
      };

      Template.create(req.blog.id, name, template, function (err) {

        if (err) return next('Could not create template');

        res.message({success: 'Created your template called ' + name + '!', url: '/design'});
        res.redirect('/settings/design');
      });
    })

    .use(function(err, req, res, next){

      res.message({error: err});
      res.redirect(req.path);
    });
};