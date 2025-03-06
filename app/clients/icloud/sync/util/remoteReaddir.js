const config = require("config");
const MAC_SERVER_ADDRESS = config.icloud.server_address;
const MACSERVER_AUTH = config.icloud.secret; // The Macserver Authorization secret from config

module.exports = async (blogID, path) => {
  const res = await fetch(MAC_SERVER_ADDRESS + "/readdir", {
    headers: { Authorization: MACSERVER_AUTH, blogID: blogID, path: path },
  });
  const json = await res.json();

  console.log('REMOTE:', json);

  return json;
};
