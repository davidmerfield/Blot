// This exists because requiring fetch
// and doing Dropbox.Dropbox is too upsetting
// in every single file. I wrap the constructor.

const fetch = require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;
const database = require("../database");

module.exports = function (blogID, callback) {
  if (typeof callback !== "function") {
    throw new Error("Missing second parameter `callback` to createClient");
  }

  if (typeof blogID !== "string" || blogID.indexOf("blog_") !== 0) {
    return callback(new Error("Pass blog ID to createClient"));
  }

  database.get(blogID, function (err, account) {
    const dbx = new Dropbox({
      fetch: fetch,
    });

    dbx.auth.setAccessToken(account.access_token);

    if (!account.refresh_token) {
      return callback(null, dbx, account);
    }

    console.log("Updating access token based on refresh token....");
    dbx.auth.setRefreshToken(account.refresh_token);
    dbx.auth
      .checkAndRefreshAccessToken()
      .then(() => {
        let latestToken = dbx.auth.getAccessToken();

        if (latestToken === account.access_token) {
          console.log("NO CHANGE to access_token based on refresh token....");
          return callback(null, dbx, account);
        }

        console.log("CHANGED!!!! New access token based on refresh token....");
        account.access_token = latestToken;

        database.set(blogID, account, function (err) {
          if (err) return callback(err);
          console.log("SAVED!!!! New access token based on refresh token....");
          callback(null, dbx, account);
        });
      })
      .catch();
  });
};
