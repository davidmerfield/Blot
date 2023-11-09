const each = require("../each/user");
const child_process = require("child_process");
const { blog_static_files_dir, blog_folder_dir } = require("config");
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

      // user.blogs is an array of blogIDs
      for (const blogID of user.blogs) {
        const static_space_used = child_process
          .execSync(`du -sh ${blog_static_files_dir}/${blogID}`)
          .toString();
        console.log("static space used:", static_space_used);
        const folder_space_used = child_process
          .execSync(`du -sh ${blog_folder_dir}/${blogID}`)
          .toString();
        console.log("folder space used:", folder_space_used);
      }

      console.log(user.subscription);
    }
    next();
  },
  function (err) {
    if (err) throw err;
    console.log("Done!");
    process.exit();
  }
);
