const sync = require("sync");
const get = require("../get/blog");
const each = require("../each/blog");

function main(blog, callback) {
  if (blog.client !== "dropbox") return callback();
  console.log("Blog", blog.id, "Checking case local files");
  sync(blog.id, async function (err, folder, done) {
    if (err) return callback(err);

    try {
      await folder.lowerCaseContents();
    } catch (e) {
      return done(e, callback);
    }

    done(null, callback);
  });
}

if (process.argv[2]) {
  each(
    function (user, blog, next) {
      main(blog, next);
    },
    function (err) {
      if (err) throw err;
      console.log("Processed all blogs");
      process.exit();
    }
  );
} else {
  get(process.argv[2], function (err, user, blog) {
    if (err) throw err;

    main(blog, function (err) {
      if (err) throw err;
      console.log("Processed blog");
      process.exit();
    });
  });
}
