var helper = require("helper");
var type = helper.type;

module.exports = function(err, req, res, next) {
  if (!req.body) {
    return next(err);
  }

  var redirect = req.body.redirect || req.path;
  var message = "Error";

  // this should not be an object but I made
  // some bad decisions in the past. eventually
  // fix blog.set...
  if (err.message) {
    message = err.message;
  }

  if (type(err, "object"))
    for (var i in err) if (type(err[i], "string")) message = err[i];

  res.message(redirect, new Error(message));
};
