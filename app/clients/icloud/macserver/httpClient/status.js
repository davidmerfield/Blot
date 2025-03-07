const { remoteServer, Authorization } = require("../config");

module.exports = async (...args) => {
  const [blogID, status] = args;

  if (!blogID || typeof blogID !== "string") {
    throw new Error("Invalid blogID");
  }

  if (!status || typeof status !== "object") {
    throw new Error("Invalid status");
  }

  if (args.length !== 2) {
    throw new Error("Invalid number of arguments: expected 2");
  }

  console.log(`Sending status for blogID: ${blogID}`, status);

  const res = await fetch(`${remoteServer}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization, // Use the Authorization header
      blogID,
    },
    body: JSON.stringify(status),
  });

  if (!res.ok) {
    throw new Error(`Setup complete failed: ${res.statusText}`);
  }

  console.log(`Status sent for blogID: ${blogID}`);
};
