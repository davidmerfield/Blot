var Blog = require("blog");
var database = require("./database");

// Called when the user disconnects the client
module.exports = function disconnect(blogID, callback) {
  Blog.get({ id: blogID }, function (err, blog) {
    if (err || !blog) {
      return callback(err || new Error("No blog"));
    }

    Blog.set(blogID, { client: "" }, function (err) {
      if (err) return callback(err);

      // do stuff which disconnects the icloud drive
      // shared folder from updating the site here...

      database.flush(blog.owner, function (err) {
        if (err) return callback(err);

        callback(null);
      });
    });
  });
};
