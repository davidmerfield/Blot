var Blog = require("blog");
var CDN = "blotcdn.com";
var yesno = require("yesno");

function main(blog, next) {
  console.log("Blog:", blog.id, "Checking avatar...");
  if (blog.avatar.indexOf(CDN) === -1) return next();
  yesno.ask("Delete avatar?" + blog.avatar, false, function(ok) {
    if (!ok) return next();
    Blog.set(blog.id, { avatar: "" }, next);
  });
}

if (require.main === module) require("./util/cli")(main);
module.exports = main;
