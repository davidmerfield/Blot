var eachView = require('../each/view');
var Template = require('../../app/models/template');

var ONE_BRACKET = '<guid>{{blogURL}}/{{id}}</guid>';
var OB_FIXED =    '<guid>{{blogURL}}{{url}}</guid>';

var TWO_BRACKETS = '<guid>{{{blogURL}}}/{{id}}</guid>';
var TB_FIXED     = '<guid>{{{blogURL}}}{{url}}</guid>';

eachView(function(user, blog, template, view, next){

  if (!view || !view.content) return next();

  if (view.content.indexOf(ONE_BRACKET) > -1) {

    view.content = view.content.split(ONE_BRACKET).join(OB_FIXED);
    console.log(template.id, view.name, 'was fixed');

  } else if (view.content.indexOf(TWO_BRACKETS) > -1) {

    view.content = view.content.split(TWO_BRACKETS).join(TB_FIXED);
    console.log(template.id, view.name, 'was fixed');

  } else {

    // console.log(template.id, view.name, 'does not need to be fixed');
    return next();
  }

  Template.setView(template.id, view, next);

}, process.exit);
