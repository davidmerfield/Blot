const client = require("models/client");
const key = require("./key");

// retrives the case preserved name for
// a given file stored at a particular path
module.exports = function get(blogID, input, callback) {
  if (typeof input === "string") {
    client.GET(key.path(blogID, input), callback);
  } else if (Array.isArray(input)) {
    if (input.length) {
      client.MGET(input.map(key.path.bind(this, blogID)), callback);
    } else {
      callback(null, []);
    }
  } else {
    callback(new Error("Pass a string or array"));
  }
};
