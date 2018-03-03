module.exports = function(server){

  server.get('/account/log-out', function(req, res){

    var redirect = (req.query && req.query.then) || '/';

    if (!req.session) return res.redirect(redirect);

    req.session.destroy(function() {

      res.clearCookie("connect.sid");
      res.redirect(redirect);
    });
  });
};