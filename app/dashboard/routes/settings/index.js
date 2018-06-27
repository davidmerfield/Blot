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

module.exports = function(server) {
  require("./404s")(server);

  require("./flags")(server);
  require("./redirects")(server);

  server
    .route("/settings")

    .get(
      loadTemplate,
      loadPlugins,
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
    .post(parseForm, formatForm, uploadAvatar, saveForm)

    // I don't know how to handle uncaught errors
    // WIll that cause an infinite redirect?
    .all(errorHandler);
};
