module.exports = function (req, res, next) {

  // Load in functions that other routes can use
  // For instance, a route could call

  // res.success('Saved template')

  // then redirect to the same page, and the page could
  // access the message 'Saved template' in the locals
  // automatically.

  res.message = message;

  res.success = function (message, url) {
    message({success: message, url: url});
  };

  res.error = function (message, url) {
    message({error: message, url: url});
  };

  function message (obj) {

    req.session.message = req.session.message || {};

    for (var i in obj)
      req.session.message[i] = obj[i];

    if (!req.session.message.url) {
      req.session.message.url = req.path;
    }

  }


  if (!req.session.message) return next();

  if (req.session.message.url === req.path) {
    res.locals.error = req.session.error;
    res.locals.success = req.session.success;
    res.locals.errors = req.session.errors;
  }

  // This must be a client error so we set
  // a status of 400, as opposed to 500.
  if (req.session.error) res.status(400);

  // Messages only last for the next
  // page view, so expire it now.
  delete req.session.error;
  delete req.session.errors;
  delete req.session.success;

  next();
};