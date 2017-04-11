var validate = require('../../../../models/blog/validate/handle').bind(this, '');

module.exports = function (req, res, next) {

  validate(req.body.handle, function(err, handle){

    if (err) return next(err);

    req.body.handle = handle;

    next();
  });
};