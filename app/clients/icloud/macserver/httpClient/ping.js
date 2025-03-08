const { remoteServer, Authorization } = require("../config");
const fetch = require("../../util/rateLimitedFetchWithRetriesAndTimeout");

module.exports = async (...args) => {
  if (args.length !== 0) {
    throw new Error("Invalid number of arguments: expected 0");
  }

  const res = await fetch(remoteServer + "/ping", {
    headers: {
      Authorization, // Use the Authorization header
    },
  });

  const text = await res.text();
  
  console.log(`Ping response: ${text}`);
};
