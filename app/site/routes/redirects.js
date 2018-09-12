var dashboard = require('../../dashboard');
var dashboard_routes = [];
var type = require('helper').type;

var MAP = {
  '/apps': '/plugins',
  '/cancel': '/account/cancel',
  '/update-billing': '/account/update-billing',
  '/logout': '/account/log-out',
  '/account/logout': '/account/log-out',
  '/create-blog': '/account/create-blog',
  '/settings': '/preferences',
  '/settings/404s': '/404s',
  '/settings/design': '/theme',
  '/settings/design/new': '/theme/new',
  '/settings/redirects': '/preferences',
  '/settings/typography': '/preferences',
  '/settings/images': '/preferences',
  '/settings/add-ons': '/preferences'
};

// Determine dashboard apps for redirector
// this should only be routes for get requests...
// it causes an infinite loop for route spec which
// matches /account* but not a specific route.
dashboard._router.stack.forEach(function(middleware){

  // routes registered directly on the app
  if (middleware.route) {

    if (type(middleware.route.path, 'array')) {
      return middleware.route.path.forEach(function(path){
        dashboard_routes.push(path);
      });      
    }

    return dashboard_routes.push(middleware.route.path);
  }

  // router middleware
  if (middleware.name === 'router') {

    middleware.handle.stack.forEach(function(handler){

      if (handler.route) {
        dashboard_routes.push(handler.route.path);
      }

    });
  }

});

// Map /account/:foo/bar* to just /account
// We'll see if a given request matches
// the base to determine whether to redirect
// the user to the log in page or not... 
dashboard_routes = dashboard_routes.map(function(route){

  if (!route.slice) {
    console.log(route);
    return '/'
  }

  route = route.slice(1);
  route = route.split('*').join('');

  if (route.indexOf('/') > -1)
    route = route.slice(0, route.indexOf('/'));

  return '/' + route;
});

// Reduce to list of unique routes and skip the 
// index route, which should never match.
dashboard_routes = dashboard_routes.filter(function(route, i){

  if (route === '/') return false;
  if (i !== dashboard_routes.indexOf(route)) return false;

  return true;
});

module.exports = function (req, res, next) {

  var redirect;

  // See if there's an existing redirect in
  // the list above for this request.
  if (MAP[req.path]) redirect = MAP[req.path];

  // If not, see if there's a path on the dashboard
  // which might match. Then ask the user to log in
  // if we find one...
  dashboard_routes.forEach(function(route){
    if (req.path.indexOf(route) === 0)
      redirect = '/log-in?then=' + req.path;
  });

  if (redirect) return res.redirect(redirect);

  next();
};