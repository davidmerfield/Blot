module.exports = function(req, res, next) {
  for (var i in res.locals.blog.menu) {
    res.locals.blog.menu[i].index = i;
    res.locals.blog.menu[i].page = res.locals.blog.menu[i].id[0] === "/";
  }

  next();
};
