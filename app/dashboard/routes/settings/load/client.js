var clients = require("clients");

module.exports = function(req, res, next) {
  res.locals.client = clients[req.blog.client];
  next();
};
