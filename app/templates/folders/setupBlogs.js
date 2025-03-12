const { promisify } = require("util");

const Blog = require("models/blog");
const setBlog = promisify(Blog.set);
const getBlog = promisify(Blog.get);
const createBlog = promisify(Blog.create);

const config = require("./config");
const basename = require("path").basename;

module.exports = async function setupBlogs(user, folders) {
  const blogs = {};

  // Create/get blogs
  for (const path of folders) {
    const handle = basename(path);
    let blog = await getBlog({ handle });

    if (blog && blog.owner !== user.uid) {
      throw new Error(`${blog.handle} owned by another user`);
    }

    if (!blog) {
      blog = await createBlog(user.uid, { handle });
    }

    const update = config[blog.handle] || {};

    await setBlog(blog.id, { ...update, client: "" });

    blogs[blog.id] = { path, blog };
  }

  return blogs;
};
