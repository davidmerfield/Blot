var LogInError = require("./logInError");

module.exports = function errorHandler(err, req, res, next) {
  if (!(err instanceof LogInError)) {
    return next(err);
  }

  res.locals.error = res.locals[err.code] = true;
  res.locals.email = req.body && req.body.email;
  res.status(403);

  next(err);
};
