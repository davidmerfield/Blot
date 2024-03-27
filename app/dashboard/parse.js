const { urlencoded } = require("body-parser");

// We need to be able to send CSS files through the
// template editor and they sometimes include base64 stuff.
const MAX_POST_REQUEST_SIZE = "5mb";

module.exports = urlencoded({
  extended: false,
  limit: MAX_POST_REQUEST_SIZE,
});
