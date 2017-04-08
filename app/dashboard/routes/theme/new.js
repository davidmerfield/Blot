var Template = require('template');

var TITLE = 'Create a new theme';
var NO_NAME = 'Please choose a name for your new template.';
var NO_CLONE = 'Please choose a template to clone.';
var DEFAULT = 'Could not create your template';
var SUCCESS = 'Created your template succesfully!';

module.exports = function (server) {

  server.route('/theme/new')

    .get(function(req, res) {
      res.title(TITLE);
      res.renderDashboard('theme/new');
    })

    .post(function(req, res){

      var name = req.body.name;
      var cloneFrom = req.body.cloneFrom;

      if (!name) {
        res.message({error: NO_NAME});
        return res.redirect(req.path);
      }

      if (!cloneFrom) {
        res.message({error: NO_CLONE});
        return res.redirect(req.path);
      }

      var template = {
        isPublic: false,
        name: name,
        cloneFrom: cloneFrom
      };

      Template.create(req.blog.id, name, template, function (error) {

        if (error) {
          res.message({error: error.message || DEFAULT});
          return res.redirect(req.path);
        }

        res.message({success: SUCCESS, url: '/theme'});
        res.redirect('/theme');
      });
    });
};