(async function () {
  const database = require("../database");
  const accounts = await database.allAccounts();
  const createDriveClient = require("../util/createDriveClient");

  for (const account of accounts) {
    if (account.permissionId) {
      console.log("Already fetched permissionId for " + account.blogID);
      continue;
    }

    console.log("Fetching permissionId for " + account.blogID);

    let permissionId;

    try {
      if (!account.blogID) throw new Error("no blog ID!");

      const { drive } = await createDriveClient(account.blogID);
      const response = await drive.about.get({ fields: "*" });
      permissionId = response.data.user.permissionId;
    } catch (e) {
      console.log(
        "Failed to fetch permissionId for " +
          account.blogID +
          " Error: " +
          e.message
      );
      continue;
    }

    if (permissionId) {
      await database.setAccount(account.blogID, {
        permissionId,
      });

      console.log(
        "Stored permissionId=" + permissionId + " for " + account.blogID
      );
    } else {
      console.log("No permissionId to store for " + account.blogID);
    }
  }

  console.log("Processed all accounts!");
  process.exit();
})();
