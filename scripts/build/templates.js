var Template = require("../../app/models/template");
var async = require("async");
var fs = require("fs-extra");

all("SITE", __dirname + "/../../app/templates", function(err, templates) {
  async.each(
    templates,
    function(template, next) {
      Template.update(template.id, { isPublic: true }, next);
    },
    function(err) {
      if (err) throw err;
      console.log("BUILT!");
    }
  );
});

// Reads a directory containing template directories
// this is used to build Blot's templates (owner === 'SITE')
// and also to build templates the user is editing locally
// inside /Templates
function all(owner, dir, callback) {
  fs.readdir(dir, function(err, contents) {
    if (err) return callback(err);

    async.filter(
      contents,
      function(item, next) {
        fs.stat(dir + "/" + item, function(err, stat) {
          if (err) return next();
          next(null, stat.isDirectory());
        });
      },
      function(err, contents) {
        if (err) return callback(err);
        async.map(
          contents,
          function(item, next) {
            Template.read(owner, dir + "/" + item, next);
          },
          callback
        );
      }
    );
  });
}
