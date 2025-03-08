const { remoteServer, Authorization } = require("../config");
const fetch = require("./rateLimitedFetchWithRetriesAndTimeout");

module.exports = async (...args) => {
  const [blogID, path, body, modifiedTime] = args;

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

  if (args.length !== 4) {
    throw new Error("Invalid number of arguments: expected 4");
  }

  const pathBase64 = Buffer.from(path).toString("base64");

  await fetch(`${remoteServer}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      Authorization,
      blogID,
      pathBase64,
      modifiedTime,
    },
    body,
  });

  console.log(`Upload successful`);
};
