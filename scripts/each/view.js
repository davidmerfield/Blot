var eachTemplate = require('./template');
var Template = require('../../app/models/template');
var helper = require('../../app/helper');
var forEach = helper.forEach;

module.exports = function (doThis, callback) {

  eachTemplate(function(user, blog, template, nextTemplate){

    Template.getAllViews(template.id, function(err, views){

      if (err) throw err;

      forEach(views, function(name, view, nextView){

        doThis(user, blog, template, view, nextView);

      }, nextTemplate);
    });

  }, callback);
};