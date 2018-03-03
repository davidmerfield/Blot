module.exports = function (req, res, next) {
  res.locals.menu = {};
  res.locals.title = '404';
  res.status(404);
  res.render('error');
};