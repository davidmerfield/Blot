module.exports = function(server){

  server.get('/account/logout', function(req, res){

    var redirect = req.query.redirect || '/';

    if (!req.session) return res.redirect(redirect);

    req.session.destroy(function() {

      res.redirect(redirect);
    });
  });
};