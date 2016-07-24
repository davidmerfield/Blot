module.exports = function(server){

  var config = require('../../../config');
  var Template = require('../../models/template');
  var Blog = require('../../models/blog');

  var helper = require('../../helper');
  var arrayify = helper.arrayify;

  var restrict = require('../../authHandler').enforce;
  var parse = require('body-parser').urlencoded({extended:false});

  server.route('/design/new')

    .all(restrict)

    .get(loadTemplates, function (req, res) {

      res.addLocals({
        title: 'Blot - New template',
        name: 'Design',
        tab: {design: 'selected', create: 'selected'}
      });

      res.addPartials({
        sub_nav: 'dashboard/design/_nav',
        yield: 'dashboard/design/new'
      })

      res.render('dashboard/_wrapper');
    })

    .post(parse, function(req, res){

      var name = req.body.name;
      var cloneFrom = req.body.cloneFrom;

      if (!name) {
        res.message({error: 'Please choose a name for your new template.'});
        return res.redirect(req.path);
      }

      if (!cloneFrom) {
        res.message({error: 'Please choose a template to clone.'});
        return res.redirect(req.path);
      }

      var newTemplate = {
        isPublic: false,
        name: name,
        cloneFrom: cloneFrom
      };

      Template.create(req.blog.id, name, newTemplate, function (error) {

        if (error) {
          res.message({error: error.message || 'Could not create your template'});
          res.redirect(req.path);
        } else {
          res.message({success: 'Created your template called ' + name + '!', url: '/design'});
          res.redirect('/design');
        }
      });
    });

  server.route('/design')

    .all(restrict)

    .get(loadTemplates, function (req, res) {

      res.addLocals({
        title: 'Blot - Design',
        name: 'Design',
        tab: {design: 'selected', select: 'selected'}
      });

      res.addPartials({
        yield: 'dashboard/design/index',
        sub_nav: 'dashboard/design/_nav'
      });

      res.render('dashboard/_wrapper');
    })

    .post(parse, function(req, res){

      var templateID = req.body.template;

      // Blog selected a new template
      if (templateID && templateID === req.blog.template)
        return res.redirect(req.path);

      var blogID = req.blog.id;
      var updates = {template: templateID};

      Template.getMetadata(templateID, function(err, template){

        if (err || !template) {
          res.message({error: 'That template does not exist.'});
          return res.redirect(req.path);
        }

        Blog.set(blogID, updates, function (errors, changed) {

          if (errors && errors.template) {

            res.message({error: errors.template});

          } else if (changed.indexOf('template') > -1) {

            res.message({success: 'Changed your template to ' + template.name});
          }

          res.redirect(req.path);
        });
      });
    });

  var previewHost = 'http://preview';
  var ignored = ['blank', 'monotone', 'mono', 'original', 'serif'];

  function loadTemplates (req, res, next) {

    var blog = req.blog,
        blogID = blog.id,
        currentTemplate = blog.template,
        defaultTemplate = Template.defaultTemplate;

    Template.getTemplateList(blogID, function(err, templates){

      var yourTemplates = [];
      var blotTemplates = [];

      // Turn the dictionary of templates returned
      // from the DB into a list that Mustache can render
      templates = arrayify(templates, function(template){

        template.nameLower = template.name.toLowerCase();

        if (template.owner === blog.id)
          template.isMine = true;

        if (template.id === defaultTemplate)
          template.isDefault = true;

        if (template.id === currentTemplate)
          template.checked = 'checked';

        if (!template.checked && ignored.indexOf(template.name.toLowerCase()) > -1)
          return false;

        var mySubDomain = template.isMine ? 'my.' : '';

        template.editURL = '/template/' + template.slug;

        template.previewURL =
          previewHost + '.' +
          mySubDomain +
          template.slug + '.' +
          blog.handle + '.' +
          config.host;

        if (template.owner === blogID)
          yourTemplates.push(template);

        if (template.owner !== blogID)
          blotTemplates.push(template);

      });

      // Sort templates alphabetically,
      // with my templates above site tmeplates
      templates.sort(function (a,b) {

        if (a.isMine && !b.isMine) return -1;

        if (b.isMine && !a.isMine) return 1;

        var aName = a.name.trim().toLowerCase();

        var bName = b.name.trim().toLowerCase();

        if (aName < bName) return -1;

        if (aName > bName) return 1;

        return 0;
      });

      res.addLocals({templates: templates});

      next();
    });
  }
};