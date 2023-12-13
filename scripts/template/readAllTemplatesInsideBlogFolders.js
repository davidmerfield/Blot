var buildFromFolder = require("models/template/buildFromFolder");
var eachBlog = require("../each/blog");

if (require.main === module) {
  main(function (err) {
    if (err) throw err;
    console.log("Re-read all templates inside blog folders!");
    process.exit();
  });
}

function main (callback) {
  eachBlog(function (user, blog, next) {
    if (!user || !blog || !blog.id) return next();
    buildFromFolder(blog.id, function (err) {
      if (err) console.log(err);
      next();
    });
  }, callback);
}

module.exports = main;
