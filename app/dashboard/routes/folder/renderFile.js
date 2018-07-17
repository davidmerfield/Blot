var stat = require("./stat");

module.exports = function(req, res, next) {
  stat(req.blog, req.dir, function(err, stat) {
    if (err) return next(err);
    
    res.locals.stat = stat;
    res.addPartials({ entry: "folder/entry", stat: "folder/stat" });
    res.title("Your folder");
    res.renderDashboard("folder/file");
  });
};
