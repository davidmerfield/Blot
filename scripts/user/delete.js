var Delete = require("../../app/dashboard/routes/account/delete");
var get = require("../blog/get");
var yesno = require("yesno");
var colors = require("colors");
var async = require("async");

get(process.argv[2], function(user, blog, blogs) {
  yesno.options.yes = [user.email];
  var message = [
    "Do you want to delete account " + colors.red(user.email) + "?"
  ];

  if (user.subscription) {
    message.push(
      "- Will delete Stripe customer " +
        colors.red(user.subscription.customer) +
        " and cancel subscription"
    );
  } else {
    message.push("- No Stripe subscription to remove");
  }

  if (blogs.length) {
    blogs.forEach(function(blog) {
      message.push(
        "- Will delete blog " +
          [colors.red(blog.handle), "(id " + blog.id + ")"].join(" ")
      );
    });
  } else {
    message.push("- No blogs to delete");
  }

  message.push("Please re-enter the account's email address to confirm:");

  yesno.ask(message.join("\n"), false, function(yes) {
    if (!yes) {
      console.log("\nDid not delete " + user.email);
      return process.exit();
    }

    var req = { user: user, blogs: blogs };
    var res = {};

    async.applyEachSeries(
      async.reflectAll([
        Delete.exports.blogs,
        Delete.exports.subscription,
        Delete.exports.user
      ]),
      req,
      res,
      function(err, results) {

        console.log();

        if (results[0].error) {
          console.log(colors.red('Error deleting blogs: ' + results[0].error));
        } else {
          console.log(colors.green('Deleted all the user\'s blogs!'));
        }

        if (results[1].error) {
          console.log(colors.red('Error deleting subscription: ' + results[1].error));
        } else {
          console.log(colors.green('Deleted subscription!'));
        }

        if (results[2].error) {
          console.log(colors.red('Error deleting user: ' + results[2].error));
        } else {
          console.log(colors.green('Deleted user!'));
        }

        if (results.slice(2).filter(function(i){return !!i.error;}).length) {
          throw new Error('Unhandled error in results ' + results);
        }

        process.exit();
      }
    );
  });
});
