const fetch = require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;

module.exports = async function dropboxAccount(account) {
  const { access_token } = account;

  const client = new Dropbox({
    fetch: fetch,
  });

  client.auth.setAccessToken(access_token);

  const { result } = await client.usersGetCurrentAccount();

  const { account_id, email } = result;

  account = {
    ...account,
    account_id,
    email,
    error_code: 0,
    last_sync: Date.now(),
    folder: "",
    folder_id: "",
    cursor: "",
  };

  return account;
};
