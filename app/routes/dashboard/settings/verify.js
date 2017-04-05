var verifyRoute = '/verify/domain-setup',
    makeRequest = require('request'),
    auth = require('authHandler'),
    url = require('url');

module.exports = function(server){

  // Called on the site to call the individual
  // blog. We could make this call directly but
  // to do so would violate our CSP. This is posssibly safer
  server.get('/verify-domain/:domain', auth.enforce, function(request, response){

    var domain = request.params.domain;
        domain = domain.replace(' ', '');

    if (domain.indexOf('//') > -1)
        domain = url.parse(domain).hostname;

    var options = {

      // Change this to https is the
      // user requries SSL to visit blog
      uri: 'http://' + domain + verifyRoute,

      // The request module has a known bug
      // which leaks memory and event emitters
      // during redirects. We cap the maximum
      // redirects to 5 to avoid encountering
      // errors when it creates 10+ emitters
      // for a URL with 10+ redirects...
      maxRedirects: 5
    };

    makeRequest(options, function (error, res, body) {
      response.send(body === request.blog.handle);
    });
  });

  var Sync = require('../../../sync');
  var VerifyFolder = require('../../../sync/dropbox/verify');
  var VerifyBlog = require('../../../verify');
  var redis = require('redis');

  server.get('/verify-status', auth.enforce, function(req, res){

    var blogID = req.blog.id;
    var client = redis.createClient();

    req.socket.setTimeout(Number.MAX_VALUE);

    res.writeHead(200, {
      // This header tells NGINX to NOT
      // buffer the response. Otherwise
      // the messages don't make it to the client.
      // A similar problem to the one caused
      // by the compression middleware a few lines down.
      'X-Accel-Buffering': 'no',

      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    res.write('\n');

    client.subscribe('verify:status:' + blogID);

    client.on('message', function(channel, message){
      res.write('\n');
      res.write('data: ' + message + '\n\n');
      res.flush();
    });

    // In case we encounter an error...print it out to the console
    client.on('error', function(err) {
      console.log('Redis Error: ' + err);
    });

    req.on('close', function() {
      client.unsubscribe();
      client.quit();
    });
  });

  server.post('/verify', auth.enforce, function(req, res, next){

    var blog = req.blog;

    Sync(req.user.uid, function(err){

      if (err) return next(err);

      VerifyFolder(blog.id, function(err){

        if (err) return next(err);

        VerifyBlog(blog.id, function(err){

          if (err) return next(err);

          return res.redirect('/verify');
        });
      });
    });
  });

  server.get('/verify', auth.enforce, function(request, response){

    response.addLocals({
      partials: {yield: 'dashboard/verify'},
      title: 'Blot - Verify',
      tab: {home: 'selected'}
    });

    return response.render('dashboard/_wrapper');
  });

};