module.exports = function(req, res, next) {
    

  for (var i in res.locals.blog.menu) {
    res.locals.blog.menu[i].index = i;
  }
  
  next();
};
