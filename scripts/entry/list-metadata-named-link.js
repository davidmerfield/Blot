var each = require("../each/entry");
var colors = require("colors/safe");

// stricter metadata key rules:
// - alphabetical characters only + spaces
// - no more than one space

each(
  function (user, blog, entry, next) {
    for (var key in entry.metadata) {
      if (key.toLowerCase().trim() !== "link") continue;
      console.log(
        colors.yellow(user.email),
        colors.dim("https://" + blog.handle + ".blot.im/" + entry.url),
        colors.dim("set to " + key + ": " + entry.metadata[key])
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
