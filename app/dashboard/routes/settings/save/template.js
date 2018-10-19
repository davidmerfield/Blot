var Blog = require("blog");

module.exports = function(req, res) {
  var blogID = req.blog.id;

  Blog.set(blogID, { template: req.body.template }, function(errors, changed) {
    if (errors && errors.template) {
      res.message(req.path, new Error(errors.template));
    } else if (changed.indexOf("template") > -1) {
      res.message(req.path, "Changed your template");
    }
  });
};
