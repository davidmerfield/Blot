var createClient = require("../util/createClient");

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
      next();
    })

    .catch(next);
};
