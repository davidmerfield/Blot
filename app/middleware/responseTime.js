module.exports = function(req, res, next) {

  var start = Date.now();

  res.on('finish', function() {
    var duration = Date.now() - start;
    console.log(duration + 'ms', req.protocol + '://' + req.get('host') + req.originalUrl);
  });

  next();
};