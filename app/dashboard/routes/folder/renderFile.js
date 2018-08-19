var stat = require("./stat");

module.exports = function(req, res, next) {
  stat(req.blog, req.dir, function(err, stat) {
    
    if (err) return next(err);

    if (res.locals.contents) return next();
    
    res.locals.stat = stat;
    res.locals.partials.folder = "folder/file";
    res.locals.partials.entry = "folder/entry";
    res.locals.partials.stat = "folder/stat";

    next();
  });
};
