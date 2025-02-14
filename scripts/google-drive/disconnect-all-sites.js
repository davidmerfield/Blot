const each = require("../each/blog");
const Blog = require("models/blog");
const disconnect = require('clients/google-drive/disconnect');

each(
  (user, blog, next) => {
    if (!blog || blog.isDisabled) return next();
    if (blog.client !== 'google-drive') return next();

    console.log('Disconnecting blog', blog.id, 'with client=', blog.client);

    disconnect(blog.id, function (err) {

        if (err) {
            console.error("Error disconnecting blog", blog.id, err);
        }

        next();
    });
    },
  err => {
    if (err) throw err;
    console.log("All blogs processed!");
    process.exit();
  }
);
