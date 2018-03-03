var config = require('config');

function production (err, req, res, next) {

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
};

function dev (err, req, res, next) {
  next(err);
}

if (config.environment === 'development') {
  module.exports = dev;
} else {
  module.exports = production;
}
