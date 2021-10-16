var each = require("../each/entry");
var colors = require("colors/safe");

// stricter metadata key rules:
// - alphabetical characters only + spaces
// - no more than one space

each(
  function (user, blog, entry, next) {
    for (var key in entry.metadata) {
      if (key.indexOf(" ") === -1) continue;
      if (key.split(" ").length > 5) continue;
      console.log(
        colors.dim(blog.id + ":" + entry.id),
        colors.green(key),
        colors.dim(":" + entry.metadata[key])
      );
    }

    next();
  },
  function (err) {
    if (err) throw err;
    console.log("Done!");
    process.exit();
  }
);
