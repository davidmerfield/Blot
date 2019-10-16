module.exports = function(req, res, next) {
  // Expose a valid message to the view
  if (req.session.message) {
    if (req.session.message.url === req.path) {
      res.locals.message = req.session.message;
    }

    if (req.session.message.error) {
      res.status(400);
    }

    delete req.session.message;
  }

  res.message = function(value, message) {
    if (message instanceof Error) {
      req.session.message = {
        text: message.message || "Error",
        error: true,
        url: value
      };
    } else if (typeof message === "string") {
      req.session.message = {
        text: message,
        error: false,
        url: value
      };
    }

    res.redirect(value);
  };

  next();
};
