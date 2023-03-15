var clients = require("clients");

module.exports = function (req, res, next) {
  res.locals.client = clients[req.blog.client];
  // convert function into boolean so we can determine if
  // the function exists or not – this is an optional
  // method to resync the folder from scratch
  res.locals.client.canResync = !!res.locals.client.resync;
  next();
};
