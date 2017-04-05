module.exports = function (identifier) {

  return function (req, res) {

    var client = redis.createClient();

    // AKA infinity. We don't want to connection
    // closed unless the user closes the page.
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

    client.subscribe(identifier + ':' + req.session.id);

    client.on('message', function(channel, message){

      // The new lines and data: prefix is just a
      // convention I guess.
      res.write('\n');
      res.write('data: ' + message + '\n\n');

      // We need to call flush after sending the
      // message to prevent the compression middleware
      // from buffering the messages and actually
      // send them to the client. More information
      // about this issue here: https://github.com/expressjs/compression#server-sent-events
      res.flush();
    });

    client.on('error', function(err) {
      console.log('Redis Error: ' + err);
    });

    req.on('close', function() {
      client.unsubscribe();
      client.quit();
    });
  };
};