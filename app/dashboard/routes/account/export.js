var Entries = require("entries");
var Template = require("template");
var helper = require("helper");
var forEach = helper.forEach.parallel;
var Express = require("express");
var Export = new Express.Router();

Export.route("/")
  
  .get(function(req, res){
    res.render('account/export', {
      title: 'Export your data',
      subpage_title: 'Export',
      subpage_slug:'export'
    });
  });

Export.route("/account.json")  
  
  .get(function(req, res, next){

    var blogs = {};

    forEach(req.blogs || [], function(blog, nextBlog){

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

module.exports = Export;