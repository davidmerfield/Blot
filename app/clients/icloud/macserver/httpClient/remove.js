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

  console.log(`Issuing external delete for blogID: ${blogID}, path: ${path}`);
  const pathBase64 = Buffer.from(path).toString("base64");

  const res = await fetch(`${remoteServer}/delete`, {
    method: "POST",
    headers: {
      Authorization,
      blogID,
      pathBase64,
    },
  });

  if (!res.ok) {
    throw new Error(`Delete failed: ${res.statusText}`);
  }

  console.log(`Delete successful: ${await res.text()}`);
};
