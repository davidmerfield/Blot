const { remoteServer, Authorization } = require("../config");

module.exports = async (...args) => {
  const [blogID, path] = args;

  if (!blogID || typeof blogID !== "string") {
    throw new Error("Invalid blogID");
  }

  if (!path || typeof path !== "string") {
    throw new Error("Invalid path");
  }

  if (args.length !== 2) {
    throw new Error("Invalid number of arguments: expected 2");
  }

  console.log(`Issuing external mkdir for blogID: ${blogID}, path: ${path}`);
  const pathBase64 = Buffer.from(path).toString("base64");

  const res = await fetch(`${remoteServer}/mkdir`, {
    method: "POST",
    headers: {
      Authorization, // Use the Authorization header
      blogID,
      pathBase64,
    },
  });

  if (!res.ok) {
    throw new Error(`Mkdir failed: ${res.statusText}`);
  }

  console.log(`Issuing external mkdir successful: ${await res.text()}`);
};
