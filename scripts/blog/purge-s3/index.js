// - regenerate all thumbnails in blog posts which contain a link to blotcdn
// - regenerate all cached images in blog posts which point to blotcdn
// - check head for links to blotcdn

// perhaps in seperate script
// - delete folder on s3 which corresponds

var each = require("../each/blog");
var CDN = "blotcdn.com";

module.exports = function(callback) {
  each(function(blog, user, next) {
    if (JSON.stringify(blog).indexOf(CDN) > -1)
      console.log(blog.id, "contains reference to CDN");

    if (JSON.stringify(user).indexOf(CDN) > -1)
      console.log(user.uid, "contains reference to CDN");

    next();
  }, callback);
};
