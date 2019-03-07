var get = require("../blog/get");
var Template = require("../../app/models/template");

if (require.main === module) {
  get(process.argv[2], function(user, blog) {
    main(blog.id, function(err) {
      if (err) throw err;

      process.exit();
    });
  });
}
function main(blogID, callback) {
  Template.getTemplateList(blogID, function(err, templates) {
    if (err) return callback(err);

    console.log(
      templates.map(function(template) {
        return {
          name: template.name,
          id: template.id,
          cloneFrom: template.cloneFrom
        };
      })
    );

    callback(null);
  });
}
