var log = require('middleware').log;
var Express = require('express');
var error_router = Express.Router();

// 404s
error_router.use(log.four04);

error_router.use(function(req, res) {
  res.locals.menu = {};
  res.locals.title = '404';
  res.status(404);
  res.render('error');
});

// Errors
// We pass in four arguments to ensure this handles
// errors, despite the fact that we don't use next...
error_router.use(log.error);

error_router.use(function(err, req, res, next) {

  // This reponse was partially finished
  // end it now and get over it...
  if (res.headersSent) return res.end();
  
  var status = 500;
  var title = err.message || 'Error';

  if (err.code === 'EBADCSRFTOKEN') {
    title = 'Permission denied';
    status = 403;
  }

  if (err.code === 'NOBLOG') {
    status = 404;
  }

  res.locals.title = title;
  res.status(500);
  res.render('error');
});

module.exports = error_router;