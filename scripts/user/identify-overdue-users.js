const each = require("../each/user");
const child_process = require("child_process");
const { blog_static_files_dir, blog_folder_dir } = require("config");
const prettySize = require("helper/prettySize");
let rolling_total = 0;

each(
  function (user, next) {
    if (
      user.isDisabled ||
      (user.subscription && user.subscription.status === "unpaid")
    ) {
      // new Date(user.subscription.current_period_end * 1000)

      let user_total = 0;
      // user.blogs is an array of blogIDs
      for (const blogID of user.blogs) {
        // console.log("blogID", blogID);

        try {
          const static_space_used = child_process
            .execSync(`du -sb ${blog_static_files_dir}/${blogID}`)
            .toString();

          const folder_space_used = child_process
            .execSync(`du -sb ${blog_folder_dir}/${blogID}`)
            .toString();

          const static_space_used_in_bytes = parseInt(
            static_space_used.trim().split("\t")[0]
          );

          const folder_space_used_in_bytes = parseInt(
            folder_space_used.trim().split("\t")[0]
          );

          const total_kilo_bytes =
            (static_space_used_in_bytes + folder_space_used_in_bytes) / 1000;

          rolling_total += total_kilo_bytes;
          user_total += total_kilo_bytes;
        } catch (e) {
          console.log("error", e);
        }
      }

      console.log(prettySize(user_total), user.email, user.blogs.join(","));
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
