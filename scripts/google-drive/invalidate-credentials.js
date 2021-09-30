const google = require("googleapis").google;
const database = require("clients/google-drive/database");
const get = require("./get-blog");
const config = require("config");

get(async function (err, user, blog) {
  if (err) throw err;

  const account = await database.getAccount(blog.id);

  if (!account || !account.access_token || !account.refresh_token)
    throw new Error("Missing credentials");

  const auth = new google.auth.OAuth2(
    config.google.drive.key,
    config.google.drive.secret
  );

  auth.setCredentials({
    refresh_token: account.refresh_token,
    access_token: account.access_token,
  });

  await auth.revokeCredentials();    

  console.log('Revoked!');
  process.exit();


});
