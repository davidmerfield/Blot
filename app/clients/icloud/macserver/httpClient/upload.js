const { remoteServer, Authorization } = require("../config");

module.exports = async (blogID, path, body, modifiedTime) => {
  const res = await fetch(`${remoteServer}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      Authorization,
      blogID,
      path,
      modifiedTime,
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.statusText}`);
  }

  console.log(`Upload successful: ${await res.text()}`);
  return;
};
