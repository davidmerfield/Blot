  var fourOhFour = require("../../../../models/404");

module.exports = function  (req, res, next) {
  var blog = req.blog;
  var blogID = blog.id;

  console.log('HERE');

  if (!req.body) return next();

  console.log('ALSO HERE');

  var ignore = req.body.ignore;
  var unignore = req.body.unignore;

  var doThis;
  var url;

  if (ignore) {
    doThis = fourOhFour.ignore;
    url = ignore;
  }

  if (unignore) {
    doThis = fourOhFour.unignore;
    url = unignore;
  }

  if (!doThis || !url) return res.redirect(req.route.path);

  doThis(blogID, url, function(err) {
    if (err) return next(err);

    return res.redirect(req.route.path);
  });
}