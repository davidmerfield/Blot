module.exports = function(err, req, res, next) {
  if (err.message === "NOUSER") return next();

  console.log(err);
  console.log(err.trace);
  console.log(err.stack);
  res.status(500);
  res.send(":( Error");
};
