const Blog = require("models/blog");
const database = require("./database");
const createDriveClient = require("./util/createDriveClient");
const debug = require("debug")("blot:clients:google-drive");
const config = require("config");
const WEBHOOK_HOST = config.environment === "development" ? config.webhooks.relay_host : config.host;
const ADDRESS = `https://${WEBHOOK_HOST}/clients/google-drive/webhook`;

module.exports = async (blogID, callback) => {
  
    await database.blog.delete(blogID);

    Blog.set(blogID, { client: "" }, async function (err) {
        callback();
    });
};