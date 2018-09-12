var debug = require('debug')('messenger');

module.exports = function (req, res, next) {

  if (!req.session) {
    debug('No session');
    return next();
  }


  res.message = function (obj) {

    debug('message invoked', obj);

    req.session.message = req.session.message || {};

    for (var i in obj)
      req.session.message[i] = obj[i];

    if (!req.session.message.url) {
      req.session.message.url = req.path;
    }

  };

  if (!req.session.message) {
    debug('No message');    
    return next();
  }

  if (req.session.message.url === req.path) {

    debug('setting message');
    res.locals.message = req.session.message;

    console.log(res.locals.message);
    
    if (req.session.message.error) res.status(400);

  } else {

    debug('ignoring message');

  }

  debug('deleting message');
  delete req.session.message;

  return next();
};