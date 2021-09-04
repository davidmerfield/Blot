const fetch = require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;

module.exports = function (req, res, next) {
  if (!req.access_token) return next(new Error("No access token"));

  const client = new Dropbox({
    fetch: fetch,
  });

  client.auth.setAccessToken(req.access_token);

  client
    .usersGetCurrentAccount()

    .then(function (response) {
      let { account_id, email } = response.result;

      req.unsavedAccount = {
        account_id,
        access_token: req.access_token,
        refresh_token: req.refresh_token,
        email,
        error_code: 0,
        last_sync: Date.now(),
        full_access: req.query.full_access === "true",
        folder: "",
        folder_id: "",
        cursor: "",
      };
      next();
    })

    .catch(next);
};
