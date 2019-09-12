var get = require("../get/blog");
var Template = require("../../app/models/template");

if (require.main === module) {
  get(process.argv[2], function(err, user, blog) {
    main(blog, function(err) {
      if (err) throw err;

      process.exit();
    });
  });
}

function main(blog, callback) {
  Template.getTemplateList(blog.id, function(err, templates) {
    if (err) return callback(err);

    templates
      .filter(function(template) {
        return template.id.indexOf("SITE:") !== 0;
      })
      .map(function(template) {
        return {
          name: template.name,
          id: template.id,
          cloneFrom: template.cloneFrom
        };
      })
      .forEach(function(template){
        console.log(template.id, template.name)
      });

    callback(null);
  });
}
