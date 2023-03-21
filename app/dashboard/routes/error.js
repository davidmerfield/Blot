var clfdate = require("helper/clfdate");

module.exports = function (err, req, res, next) {
  // If the user is not logged in, we sent them to the brochure
  if (err.message === "NOUSER") {
    return next();
  }

  console.log(err);
  console.log(err.trace);
  console.log(err.stack);
  res.status(500);
  res.send(":( Error");
};
