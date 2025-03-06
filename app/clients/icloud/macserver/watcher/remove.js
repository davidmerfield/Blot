const { remoteServer, Authorization } = require("../config");

module.exports = async (blogID, path) => {
  console.log(`Issuing external delete for blogID: ${blogID}, path: ${path}`);
  const res = await fetch(`${remoteServer}/delete`, {
    method: "POST",
    headers: {
      Authorization,
      blogID,
      path,
    },
  });

  if (!res.ok) {
    throw new Error(`Delete failed: ${res.statusText}`);
  }

  console.log(`Delete successful: ${await res.text()}`);
};
