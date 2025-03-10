const Blog = require("models/blog");
const database = require("./database");

const config = require("config");

const MACSERVER_URL = config.icloud.server_address; // The Macserver base URL from config
const MACSERVER_AUTH = config.icloud.secret; // The Macserver Authorization secret from config

module.exports = async (blogID, callback) => {
  await database.delete(blogID);

  const response = await fetch(`${MACSERVER_URL}/disconnect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: MACSERVER_AUTH,
      blogID: blogID,
    },
  });

  if (!response.ok) {
    console.error(`Macserver /disconnect request failed: ${response.status}`);
  }

  Blog.set(blogID, { client: "" }, async function (err) {
    callback();
  });
};
