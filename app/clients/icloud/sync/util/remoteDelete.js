const config = require("config");
const MAC_SERVER_ADDRESS = config.icloud.server_address;
const MACSERVER_AUTH = config.icloud.secret; // The Macserver Authorization secret from config

module.exports = async (blogID, path) => {
  const res = await fetch(MAC_SERVER_ADDRESS + "/delete", {
    headers: { Authorization: MACSERVER_AUTH, blogID: blogID, path: path },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete ${path}`);
  }
  
  return res.ok;
};
