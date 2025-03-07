const { remoteServer, Authorization } = require("../config");

module.exports = async (blogID, path, body, modifiedTime) => {
  if (!blogID || typeof blogID !== "string") {
    throw new Error("Invalid blogID");
  }

  if (!path || typeof path !== "string") {
    throw new Error("Invalid path");
  }

  if (!body || !(body instanceof Buffer)) {
    throw new Error("Invalid body");
  }

  if (!modifiedTime || typeof modifiedTime !== "string") {
    throw new Error("Invalid modifiedTime");
  }

  if (this.arguments.length !== 4) {
    throw new Error("Invalid number of arguments: expected 4");
  }

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
