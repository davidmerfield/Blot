module.exports = function (server) {

  var log = require('middleware').log;

  // 404s
  server.use(log.four04);
  server.use(function(req, res) {
    res.addLocals({title: '404'});
    res.status(404);
    res.render('error');
  });

  // Errors
  // We pass in four arguments to ensure this handles
  // errors, despite the fact that we don't use next...
  server.use(log.error);
  server.use(function(err, req, res, next) {

    // This reponse was partially finished
    // end it now and get over it...
    if (res.headersSent) {
      return res.end();
    }

    var status = 500;
    var title = err.message || 'Error';

    if (err.code === 'EBADCSRFTOKEN') {
      title = 'Permission denied';
      status = 403;
    }

    if (err.code === 'NOBLOG') {
      status = 404;
    }

    res.addLocals({title: title});
    res.status(500);
    res.render('error');
  });
};