const { remoteServer, Authorization } = require("../config");

module.exports = async (blogID, path) => {
  console.log(`Issuing external mkdir for blogID: ${blogID}, path: ${path}`);
  const res = await fetch(`${remoteServer}/mkdir`, {
    method: "POST",
    headers: {
      Authorization, // Use the Authorization header
      blogID,
      path,
    },
  });

  if (!res.ok) {
    throw new Error(`Mkdir failed: ${res.statusText}`);
  }

  console.log(`Issuing external mkdir successful: ${await res.text()}`);
};
