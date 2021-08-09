var blogID = process.argv[2];

if (!blogID) throw "Please specify a blog id";

var Transformer = require("transformer");
var store = Transformer(blogID, "thumbnails");

console.log("flushing", blogID);

store.flush(function (err) {
  console.log("flushed", blogID, "store");
});
