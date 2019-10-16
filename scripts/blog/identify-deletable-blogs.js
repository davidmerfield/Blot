var each = require("../each/blog");
var found = 0;
var yesno = require("yesno");
console.log(
  "Fetch latest version of subscription from Stripe for each user first:"
);
console.log("node scripts/user/fetch-subscription-from-stripe.js\n");

yesno.ask("Have you done that? (y/N)", false, function(ok) {
  if (!ok) return process.exit();
  each(
    function(user, blog, next) {
      // see if the blog has a custom domain?
      // see if the blog is still accessible?

      if (user.isDisabled) {
        console.log("Blog:", blog.id, "owner is disabled");
        found++;
        return next();
      }

      if (
        user.subscription &&
        user.subscription.status !== "active" &&
        user.subscription.current_period_end > Date.now() / 1000
      ) {
        console.log(
          "Blog:",
          blog.id,
          "owner subscription with status",
          user.subscription.status
        );
        found++;
        return next();
      }

      next();
    },
    function(err) {
      console.log("Done! Found " + found + " blogs");
      process.exit();
    }
  );
});
