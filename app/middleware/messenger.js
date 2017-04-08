module.exports = function (req, res, next) {

  if (!req.session) return next();

  res.message = function (obj) {

    req.session.message = req.session.message || {};

    for (var i in obj)
      req.session.message[i] = obj[i];

    if (!req.session.message.url) {
      req.session.message.url = req.path;
    }

  };

  if (!req.session.message) return next();

  console.log('HERE', req.url, req.session.message);

  if (req.session.message.url === req.path) {

    res.addLocals(req.session.message);

    if (req.session.message.error) res.status(400);

    console.log(res.locals);

  } else {

    console.log('ignoring message', req.session.message.url, req.path);

  }

  delete req.session.message;

  return next();
};