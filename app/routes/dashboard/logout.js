module.exports = function(server){

  server.get('/logout', function(request, response){

    var redirect = '/';

    if (request.query.redirect) redirect = request.query.redirect;

    if (!request.session) return response.redirect(redirect);

    request.session.destroy(function() {

      response.redirect(redirect);
    });
  });
};