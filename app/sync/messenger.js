const client = require("client");
const clfdate = require("helper/clfdate");
const uuid = require("uuid/v4");
const Blog = require("models/blog");

module.exports = (blogID) => {
  const syncID = "sync_" + uuid().slice(0, 7);
  const log = function () {
    console.log.apply(null, [
      clfdate(),
      blogID.slice(0, 12),
      syncID,
      ...arguments,
    ]);
  };
  const status = (message) => {
    Blog.setStatus(blogID, { message, syncID });
    log(message);
    client.publish("sync:status:" + blogID, message);
  };
  return {
    log,
    status,
  };
};
