module.exports = function(err, req, res, next) {
  var message;

  try {
    if (req.params.template && !req.template) return next();

    if (req.params.view && !req.view) return next();

    if (err.message) {
      message = err.message;
    } else {
      message = err;
    }

    res.message(req.path, err);
  } catch (e) {
    return next(e);
  }
};
