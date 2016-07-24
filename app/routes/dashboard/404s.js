module.exports = function(server){

  var restrict = require('../../authHandler').enforce;
  var parseBody = require('body-parser').urlencoded({extended:false});
  var fourOhFour = require('../../models/404');
  var List = fourOhFour.list;

  server

    .route('/404s')

    .all(restrict)

    .get(function(req, res, next){

      List(req.blog.id, function(err, list, ignored){

        if (err) return next(err);

        if (req.query.raw) {

          for (var i in list)
            list[i] = list[i].url;

          res.setHeader('Content-type', 'text/plain');
          res.charset = 'UTF-8';
          return res.send(list.join('\n'));
        }

        res.addPartials({form: 'settings/404s.html'});

        res.addLocals({
          title: 'Blot - 404s',
          tab: {settings: 'selected', redirects: 'selected'},
          list: list,
          ignored: ignored
        });

        res.render('settings/_wrapper');
      });
    })

    .post(parseBody, function(req, res, next){

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