module.exports = function(server){

  var fourOhFour = require('../../../models/404');
  var List = fourOhFour.list;

  server.route('/404s')

    .get(function(req, res, next){

      List(req.blog.id, function(err, list, ignored){

        if (err) return next(err);

        var has_ignored;

        if (req.query.raw) {

          for (var i in list)
            list[i] = list[i].url;

          res.setHeader('Content-type', 'text/plain');
          res.charset = 'UTF-8';
          return res.send(list.join('\n'));
        }

        if (ignored.length) {
          has_ignored = true;
        }

        if (!req.query.ignored) {
          ignored = [];
        }

        res.addLocals({
          list: list,
          has_ignored: has_ignored,
          ignored: ignored
        });

        res.title('404s');
        res.render('404s');
      });
    })

    .post(function(req, res, next){

      var blog = req.blog;
      var blogID = blog.id;

      if (!req.body) return next();

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

      if (!doThis || !url)
        return res.redirect(req.route.path);

      doThis(blogID, url, function(err){

        if (err) return next(err);

        return res.redirect(req.route.path);
      });
    });
};