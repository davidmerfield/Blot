const sync = require("sync");
const get = require("../get/blog");
const each = require("../each/blog");
const lowerCaseContents = require("sync/lowerCaseContents");

function main(blog, callback) {
  console.log("Blog", blog.id, "Checking case local files");
  sync(blog.id, async function (err, folder, done) {
    if (err) return callback(err);

    try {
      await lowerCaseContents(blog.id);
    } catch (e) {
      return done(e, callback);
    }

    done(null, callback);
  });
}

if (!process.argv[2]) {

  // each(
  //   function (user, blog, next) {
    //   if (blog.client !== "dropbox") return callback();

  //     main(blog, next);
  //   },
  //   function (err) {
  //     if (err) throw err;
  //     console.log("Processed all blogs");
  //     process.exit();
  //   }
  // );
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
