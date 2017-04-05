var Entries = require('entries');
var Template = require('template');
var helper = require('helper');
var forEach = helper.forEach.parallel;
var restrict = require('authHandler').enforce;

module.exports = function(server){

  server.route('/account/export')

    .get(restrict, function(req, res){

      res.addLocals({
        partials: {yield: 'dashboard/export'},
        title: 'Export your data'
      });

      res.render('dashboard/_wrapper');
    });

    // The generation of this file should eventually
    // run in a seperate process so it doesn't clog
    // the server's main thread. But I anticipate low
    // usage so it's probably fine for now...
    server.route('/account/export/account.json')

      .get(restrict, function(req, res, next){

        var blogs = {};

        forEach(req.blogs, function(blog, nextBlog){

          var templates = {};

          Template.getTemplateList(blog.id, function(err, res){

            if (err) return next(err);

            forEach(res, function(template, nextTemplate){

              // Don't include Global templates in this file...
              if (template.owner === 'SITE') return nextTemplate();

              Template.getAllViews(template.id, function(err, allviews){

                if (err) return next(err);

                template.views = allviews;
                templates[template.name] = template;

                nextTemplate();
              });
            }, function(){

              Entries.getAll(blog.id, function(entries){

                blog.entries = entries;
                blog.templates = templates;

                blogs[blog.handle] = blog;

                nextBlog();
              });
            });
          });
        }, function(){

          var result = {
            user: req.user,
            blogs: blogs
          };

          res.setHeader('Content-Type', 'application/json');
          res.header('Content-disposition', 'attachment; filename=Account.json');
          res.send(JSON.stringify(result, null, 2));
        });
      });
};