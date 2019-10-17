module.exports = {
  // String which stores the blog ID for a handle/username
  // method accepts the handle of a blog as a String
  handle: function(handle) {
    return "handle:" + handle;
  },

  // String which stores the JSON object containing the blog's data
  // method accepts the ID of a blog as a String
  info: function(blogID) {
    return "blog:" + blogID + ":info";
  },

  // String which stores the blog ID for a domain
  // method accepts the custom domain for a blog as a String
  domain: function(domain) {
    return "domain:" + domain;
  },

  // Integer which indicates the number of blogs that ever were
  totalBlogs: "total:blogs",

  // Set which stores all the IDs of extant blogs
  ids: "blogs"
};
