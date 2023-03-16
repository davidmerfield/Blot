var clients = require("clients");

module.exports = function (req, res, next) {
  const client = clients[req.blog.client];

  // convert function into boolean so we can determine if
  // the function exists or not – this is an optional
  // method to resync the folder from scratch
  const canResync = client && !!client.resync;

  res.locals.client = { ...client, canResync };

  next();
};
