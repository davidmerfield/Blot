var Template = require('template');

var TITLE = 'Create a new theme';
var NO_NAME = 'Please choose a name for your new template.';
var NO_CLONE = 'Please choose a template to clone.';
var SUCCESS = 'Created your template succesfully!';

module.exports = function (server) {

  server.route('/theme/new')

    .get(function(req, res) {
      res.locals.title = TITLE;
      res.locals.subpage_title = 'Create new theme';
      res.render('theme/new');
    })

    .post(function(req, res, next){

      var name = req.body.name;
      var cloneFrom = req.body.cloneFrom;

      if (!name) {
        return next(new Error(NO_NAME));
      }

      if (!cloneFrom) {
        return next(new Error(NO_CLONE));
      }

      var template = {
        isPublic: false,
        name: name,
        cloneFrom: cloneFrom
      };

      Template.create(req.blog.id, name, template, function (error) {

        if (error) {
          return next(error);
        }

        res.message('/theme', SUCCESS);
      });
    });
};