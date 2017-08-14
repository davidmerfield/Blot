module.exports = function(server){

  var Sync = require('../../../sync');
  var VerifyFolder = require('../../../sync/dropbox/verify');
  var VerifyBlog = require('../../../verify');
  var redis = require('redis');

  server.get('/verify-status', function(req, res, next){

    if (!req.blog) return next();

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

  server.post('/verify', function(req, res, next){

    var blog = req.blog;

    Sync(blog.id, function(err){

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

  server.get('/verify', function(request, response){

    response.title('Verify your blog');
    return response.renderDashboard('tools/verify');
  });

};