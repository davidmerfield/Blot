const each = require("../each/user");
const child_process = require("child_process");
const { blog_static_files_dir, blog_folder_dir } = require("config");
const prettySize = require("helper/prettySize");
let rolling_total = 0;

each(
  function (user, next) {
    if (user.isDisabled) {
      console.log(user.email, "is disabled");
    }

    if (user.subscription && user.subscription.status === "unpaid") {
      console.log(
        user.email,
        "has an unpaid subscription with current period end:",
        new Date(user.subscription.current_period_end * 1000)
      );
      console.log("user.blogs", user.blogs);

      // user.blogs is an array of blogIDs
      for (const blogID of user.blogs) {
        // console.log("blogID", blogID);
        const static_space_used = child_process
          .execSync(`du -sb ${blog_static_files_dir}/${blogID}`)
          .toString();
        const static_space_used_in_bytes = parseInt(
          static_space_used.trim().split("\t")[0]
        );
        console.log(
          "static space used:",
          static_space_used_in_bytes,
          static_space_used
        );

        const folder_space_used = child_process
          .execSync(`du -sb ${blog_folder_dir}/${blogID}`)
          .toString();

        const folder_space_used_in_bytes = parseInt(
          folder_space_used.trim().split("\t")[0]
        );

        console.log(
          "folder space used:",
          folder_space_used_in_bytes,
          folder_space_used
        );

        console.log(
          "total",
          prettySize(static_space_used_in_bytes + folder_space_used_in_bytes)
        );

        rolling_total +=
          static_space_used_in_bytes + folder_space_used_in_bytes;
      }

      //   console.log(user.subscription);
    }
    next();
  },
  function (err) {
    if (err) throw err;
    console.log("Done!");
    // convert rolling_total bytes to human readable size
    console.log("Total space to be deleted:", prettySize(rolling_total));
    process.exit();
  }
);
