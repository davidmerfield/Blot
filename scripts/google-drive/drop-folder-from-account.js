const createDriveClient = require("clients/google-drive/util/createDriveClient");
const database = require("clients/google-drive/database");
const get = require("./get-blog");

get(async function (err, user, blog) {
  if (err) throw err;

  const { drive, account } = await createDriveClient(blog.id);

  if (account && account.channel) {
    try {
      await drive.channels.stop({
        requestBody: account.channel,
      });
      await database.setAccount(blog.id, {
        channel: null,
      });
      console.log("Closed channel!");
    } catch (e) {
      if (e.code === 404) {
        console.log("Warning! Channel does not exist");
        await database.setAccount(blog.id, {
          channel: null,
        });
      } else {
        console.log(e);
      }
    }
  }

  await database.setAccount(blog.id, {
    folderID: "",
    folderName: "",
    folderPath: "",
  });
  console.log("Removed folder from Dropbox account!");
  process.exit();
});
