module.exports = function breadcrumbs(req, res, next) {
  var breadcrumbs = [];
  var dir = req.dir;

  if (dir === "/") {
    return next();
  }

  breadcrumbs.push({ name: "Your folder", url: "/" });

  var names = dir.split("/").filter(function(name) {
    return !!name;
  });

  names.forEach(function(name, i) {
    breadcrumbs.push({
      url: "/~/" + names.slice(0, i + 1).join("/"),
      name: name
    });
  });

  breadcrumbs[breadcrumbs.length - 1].last = true;
  
  res.addPartials({breadcrumbs: 'folder/breadcrumbs'});
  res.locals.breadcrumbs = breadcrumbs;

  return next();
};
