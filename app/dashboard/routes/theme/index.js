var Template = require('template');
var Blog = require('blog');
var load = require('./load');

module.exports = function(server){

  // Load the list of templates for this user
  server.use('/theme', load);

  // Load the other route
  require('./new')(server);

  server.route('/theme')

    .get(function(req, res) {
      res.locals.title = 'Theme';
      res.render('theme');
    })

    .post(function(req, res){

      var templateID = req.body.template;
      var blogID = req.blog.id;

      if (templateID === '') return Blog.set(blogID, {template: ''}, function (err) {
        res.message({success: 'Disabled your template'});
        res.redirect(req.path);
      });

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
};