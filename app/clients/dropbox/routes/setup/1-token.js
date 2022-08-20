const config = require("config");
const fetch = require("node-fetch");
const { Dropbox } = require("dropbox");

module.exports = async function token(account) {
  const { code, full_access, redirectUri } = account;

  const clientId = full_access
    ? config.dropbox.full.key
    : config.dropbox.app.key;

  const clientSecret = full_access
    ? config.dropbox.full.secret
    : config.dropbox.app.secret;

  const dropbox = new Dropbox({ fetch, clientId, clientSecret });

  const { result } = await dropbox.auth.getAccessTokenFromCode(
    redirectUri,
    code
  );

  const { access_token, refresh_token } = result;

  account.access_token = access_token;
  account.refresh_token = refresh_token;

  return account;
};
