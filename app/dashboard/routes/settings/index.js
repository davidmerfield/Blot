var uploadAvatar = require("./uploadAvatar");
var loadPermalinkFormats = require("./loadPermalinkFormats");
var loadPlugins = require("./loadPlugins");
var loadMenu = require("./loadMenu");
var loadTimeZones = require("./loadTimeZones");
var loadTemplate = require("./loadTemplate");
var loadClient = require("./loadClient");
var saveForm = require("./saveForm");
var parseForm = require("./parseForm");
var formatForm = require("./formatForm");
var errorHandler = require("./errorHandler");
var loadRedirects = require("./loadRedirects");
var saveRedirects = require("./saveRedirects");

module.exports = function(server) {
  require("./404s")(server);
  require("./flags")(server);

  server.get("/settings/menu", loadMenu);
  server.get("/settings/date", loadTimeZones);
  server.get("/settings/urls", loadPermalinkFormats, loadRedirects);
  server.get("/settings/typography", loadPlugins);
  server.get("/settings/images", loadPlugins);
  server.get("/settings/services", loadPlugins);
  
  server.get("/settings/:view", function(req, res, next) {
    res.addPartials({ subpage: "settings/" + req.params.view });
    res.locals.subpage_title =
      req.params.view[0].toUpperCase() + req.params.view.slice(1);
    res.locals.subpage_slug = req.params.view;
    res.renderDashboard("settings/subpage");
  });

  server
    .route("/settings")

    .get(
      loadTemplate,
      loadMenu,
      loadClient,
      loadTimeZones,
      loadPermalinkFormats,
      function(req, res) {
        res.title("Your profile");
        res.locals.tab = { settings: "selected" };
        res.renderDashboard("settings");
      }
    )

    // saving menu re-order does not work
    // saving redirects does not work
    .post(parseForm, saveRedirects, formatForm, uploadAvatar, saveForm)

    // I don't know how to handle uncaught errors
    // WIll that cause an infinite redirect?
    .all(errorHandler);
};
