var helper = require("helper");
var type = helper.type;

module.exports = function(err, req, res, next) {
  var redirect = req.body.redirect || req.path;
  var message = { url: redirect };

  // this should not be an object but I made
  // some bad decisions in the past. eventually
  // fix blog.set...
  if (type(err, "object")) {
    message.errors = err;
  } else if (err.message) {
    message.error = err.message;
  } else {
    return next(err);
  }

  res.message(message);
  res.redirect(redirect);
};
