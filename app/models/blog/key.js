module.exports = {
  handle: function (handle) {
    return 'handle:' + handle;
  },
  info: function (blogID) {
    return 'blog:' + blogID + ':info';
  },
  domain: function(domain) {
    return 'domain:' + domain;
  },
  totalBlogs: 'total:blogs'
};