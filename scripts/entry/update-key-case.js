const Entry = require("models/entry");
const eachEntry = require("../each/entry");
const options = require("minimist")(process.argv.slice(2));

const handle = (user, blog, entry, next) => {
  if (entry.path.toLowerCase() === entry.path) return next();

  Entry.set(
    blog.id,
    entry.id,
    {
      ...entry,
      path: entry.path.toLowerCase(),
      pathDisplay: entry.path,
      deleted: true,
    },
    function (err) {
      if (err) throw err;

      Entry.set(blog.id, entry.id, { ...entry }, function (err) {
        if (err) throw err;

        next();
      });
    }
  );
};

eachEntry(handle, process.exit, options);
