var ensure = require("helper/ensure");
var Entries = require("models/entries");
var eachBlog = require("./blog");

module.exports = function (doThis, allDone, options) {
  options = options || {};

  ensure(doThis, "function").and(allDone, "function").and(options, "object");

  eachBlog(
    function (user, blog, nextBlog) {
      Entries.each(
        blog.id,
        function (entry, nextEntry) {
          doThis(user, blog, entry, nextEntry);
        },
        nextBlog
      );
    },
    allDone,
    options
  );
};
