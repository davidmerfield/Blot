var eachBlog = require("./each/blog");
var Blog = require("blog");
var yesno = require("yesno");

const OLD_FORMAT = "Y-MM-DD hh:mm";
const NEW_FORMAT = "Y-MM-DD HH:mm";

eachBlog(function(user, blog, next) {
  if (blog.dateDisplay !== OLD_FORMAT) return next();

  yesno.ask(
    `Change date format for ${blog.handle} from ${OLD_FORMAT} to ${NEW_FORMAT}? (y/n)`,
    true,
    function(ok) {
      if (ok) {
        Blog.set(blog.id, { dateDisplay: NEW_FORMAT }, next);
      } else {
        console.log("Did not update date display");
        next();
      }
    }
  );
}, process.exit);
