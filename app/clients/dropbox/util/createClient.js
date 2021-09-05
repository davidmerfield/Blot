// This exists because requiring fetch
// and doing Dropbox.Dropbox is too upsetting
// in every single file. I wrap the constructor.

const fetch = require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;
const database = require("../database");
const config = require("config");

module.exports = function (blogID, callback) {
  database.get(blogID, function (err, account) {
    const client = new Dropbox({ fetch });

    client.auth.setAccessToken(account.access_token);

    // Legacy Dropbox authentications (pre September 2021)
    // won't have refresh tokens.
    // Refresh tokens are used to recieve new access tokens
    // since new access tokens now expire after 4 hours
    if (!account.refresh_token) {
      return callback(null, client, account);
    }

    let clientId = account.full_access
      ? config.dropbox.full.key
      : config.dropbox.app.key;

    let clientSecret = account.full_access
      ? config.dropbox.full.secret
      : config.dropbox.app.secret;

    client.auth.setClientId(clientId);
    client.auth.setClientSecret(clientSecret);
    client.auth.setRefreshToken(account.refresh_token);

    client.auth
      .checkAndRefreshAccessToken()
      .then(() => {
        let latestToken = client.auth.getAccessToken();

        if (latestToken === account.access_token) {
          return callback(null, client, account);
        }

        account.access_token = latestToken;

        database.set(blogID, account, function (err) {
          if (err) return callback(err);
          callback(null, client, account);
        });
      })
      .catch(function (err) {
        callback(err);
      });
  });
};
