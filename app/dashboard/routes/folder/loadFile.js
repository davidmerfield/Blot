var stat = require("./stat");

module.exports = function(req, res, next) {
  stat(req.blog, req.params.path || "/", function(err, stat) {
    
    if (err) return next(err);

    if (res.locals.folder.contents) return next();
    
    res.locals.folder.stat = stat;
    res.locals.folder.file = true;
    next();
  });
};
