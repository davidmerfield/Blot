const Sync = require("sync");
const clients = require("clients");

const each = require("../each/blog");
const yesno = require("yesno");
const get = require("../get/blog");

// const Fix = require("sync/fix");
// const Rebuild = require("sync/rebuild");

if (process.argv[2]) {
  get(process.argv[2], function (err, user, blog) {
    if (err) throw err;

    main(blog, function (err) {
      if (err) throw err;
      console.log("Resynced", blog.handle, blog.id);
      process.exit();
    });
  });
} else {
  yesno.ask("Resync all blogs? (y/N)", false, function (ok) {
    if (!ok) {
      console.log("You answered no");
      process.exit();
    }

    each(
      function (user, blog, next) {
        main(blog, next);
      },
      function () {
        console.log("All blogs processed!");
        process.exit();
      }
    );
  });
}

function main(blog, callback) {
  const client = clients[blog.client];

  if (!client) return callback();

  const resync = client.resync;

  if (!resync) return callback();

  Sync(blog.id, async function (err, folder, done) {
    if (err) {
      return callback(new Error("Failed lock folder"));
    }

    console.log("Resyncing site folder");

    try {
      await resync(blog.id);
    } catch (err) {
      console.log("Resync error:", err);
    }

    console.log("Rebuilding site");
    // Rebuild(blog.id, function (err) {
    //   if (err) console.log(err);
    //   console.log("Fixing site");
    //   Fix(blog, function (err) {
    //     if (err) console.log(err);
    //     console.log("Releasing sync");
    done(null, function (err) {
      if (err) console.log(err);
      console.log("Finished");
      callback();
    });
  });
  //   });
  // });
}
