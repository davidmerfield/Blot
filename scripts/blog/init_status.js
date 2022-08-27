const ensure = require("helper/ensure");
const Blog = require("models/blog");
const { promisify } = require("util");
const set = promisify(Blog.set);
const get = promisify(Blog.get);
const setStatus = promisify(Blog.setStatus);
const getAllIDs = promisify(Blog.getAllIDs);

(async () => {
  const blogIDs = await getAllIDs();

  for (const blogID of blogIDs) {
    let blog = await get({ id: blogID });

    if (!blog || blog.isDisabled) continue;

    if (blog.status === undefined) {
      console.log("Adding status to", blogID);
      await setStatus(blog.id, { message: "Synced", datestamp: blog.cacheID });
    }
  }

  console.log("All blogs processed!");
  process.exit();
})();
