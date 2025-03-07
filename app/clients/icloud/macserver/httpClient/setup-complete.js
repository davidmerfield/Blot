const { remoteServer, Authorization } = require("../config");

module.exports = async (blogID) => {
  if (!blogID || typeof blogID !== "string") {
    throw new Error("Invalid blogID");
  }

  if (this.arguments.length !== 1) {
    throw new Error("Invalid number of arguments: expected 1");
  }

  // Notify the remote server that setup is complete
  const res = await fetch(`${remoteServer}/setup-complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization, // Use the Authorization header
      blogID,
    },
  });

  if (!res.ok) {
    throw new Error(`Setup complete failed: ${res.statusText}`);
  }

  console.log(`Setup complete successful: ${await res.text()}`);
};
