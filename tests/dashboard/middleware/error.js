module.exports = function (err, req, res, next) {

  console.log('HERE', err);

  // Dont pass this error on. Serve the static homepage...
  if (err.code === 'NOBLOG' || err.code === 'NOUSER')
    return next();

  res.status(500).send(err.message || err.code);
};