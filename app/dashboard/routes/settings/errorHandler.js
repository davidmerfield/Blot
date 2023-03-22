var type = require("helper/type");

module.exports = function (err, req, res, next) {

  console.log('ARE WE HERE I WONDER?', err);

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
