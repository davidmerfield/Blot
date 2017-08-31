var router = require('express').Router();
var database = require('database');

router.use(function(req, res, next){

  database.get(req.blog.id, function(err, account){

    if (err) return next(err);

    res.locals.account = req.account = account;

    return next();
  });
});

router.get('/', function (req, res) {

  var error = req.query && req.query.error;

  if (error) res.locals.error = decodeURIComponent(error);

  res.dashboard('connect');
});

router.use('/authenticate', require('./authenticate'));
router.use('/change-folder', require('./change_folder'));

module.exports = router;