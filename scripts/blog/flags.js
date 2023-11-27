const get = require("../get/blog");
const Blog = require("models/blog");
const querystring = require("querystring");

if (!process.argv[2])
  throw new Error("Missing 1st arg: Pass a blog identifier");

if (!process.argv[3])
  throw new Error("Missing 2nd arg: Pass flags, e.g. google_drive_beta=true");

get(process.argv[2], (err, user, blog, url) => {
  const newFlags = querystring.parse(process.argv[3]);

  Object.keys(newFlags).forEach(
    (flag) => (newFlags[flag] = newFlags[flag] === "true")
  );

  blog.flags = { ...blog.flags, ...newFlags };

  console.log(blog.flags);

  Blog.set(blog.id, { flags: blog.flags }, (err) => {
    if (err) throw err;
    console.log("Set flags!", blog.flags);
    console.log("See dashboard:", url);
    process.exit();
  });
});
