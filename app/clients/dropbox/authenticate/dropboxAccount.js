var createClient = require("../util/createClient");
var database = require("../database");

module.exports = function(req, res, next) {
  if (!req.token) return next(new Error("No access token"));

  var client = createClient(req.token);

  client
    .usersGetCurrentAccount()

    .then(function(response) {
      req.unsavedAccount = {
        account_id: response.account_id,
        access_token: req.token,
        email: response.email,
        error_code: 0,
        last_sync: Date.now(),
        full_access: req.query.full_access === "true",
        folder: "",
        folder_id: "",
        cursor: ""
      };

      // The user has an existing dropbox account stored
      if (
        !req.account ||
        req.unsavedAccount.account_id !== req.account.account_id ||
        req.unsavedAccount.full_access !== req.account.full_access
      ) {
        next();
      } else {
        database.set(req.blog.id, { access_token: req.token }, function(err) {
          if (err) return next(err);
          res.message("/", "Set up Dropbox successfuly!");
        });
      }
    })

    .catch(next);
};
