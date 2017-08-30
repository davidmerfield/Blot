var router = require('express').Router();

router.use('/authenticate', require('./authenticate'));

router.get('/', function (req, res) {

  var error = req.query && req.query.error;

  if (error) res.locals.error = decodeURIComponent(error);

  res.dashboard('connect');
});

module.exports = router;