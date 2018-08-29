module.exports = function breadcrumbs(req, res, next) {
  var breadcrumbs = [];
  var dir = req.dir;

  breadcrumbs.push({ name: "Folder", url: "/view?path=/" });

  var names = dir.split("/").filter(function(name) {
    return !!name;
  });

  var redirect = req.header('Referer') || "/";
  
  names.forEach(function(name, i) {
    breadcrumbs.push({
      url: "/view?redirect=" + redirect + "&path=" + names.slice(0, i + 1).join("/"),
      name: name,
      path: names.slice(0, i + 1).join("/")
    });
  });

  breadcrumbs[breadcrumbs.length - 1].last = true;
  
  res.locals.partials.breadcrumbs = 'folder/breadcrumbs';
  res.locals.breadcrumbs = breadcrumbs;

  return next();
};
