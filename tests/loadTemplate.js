var loadTemplate = require('../app/render/loadTemplate');

var blogID = '1';
var themeID = 'default';
var templateName = 'archives';

loadTemplate(blogID, themeID, templateName, function(err, res){

  console.log(err);
  console.log(res);

});