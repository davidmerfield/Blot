module.exports = function(server){

  // Prevent robots from indexing
  // preview subdomains to ward off
  // accusations of farming content

  // do the same in case the user
  // has a custom domain as well.
  server.get('/robots.txt', function(request, response, next){

    if (request.previewSubdomain || (request.blog.domain && request.originalHost !== request.blog.domain)) {
      response.header("Content-type", 'text/plain');
      return response.sendFile(__dirname + '/robots_deny.txt');
    }

    return next();
  });

  // Called on individual blogs to
  // get the handle associated with them...
  server.get('/verify/domain-setup', function(request, response, next){

    if (!request.blog || !request.blog.handle) return next();

    response.send(request.blog.handle);
  });
};