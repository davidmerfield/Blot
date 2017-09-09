module.exports = {

  // JSON which stores useful information
  // information about this particular blog & dropbox account
  // combination, e.g. root directory and access token.
  account: function (blog_id) {
    return 'blog:' + blog_id + ':dropbox:account';
  },

  // A set whoses members are the blog ids
  // connected to this dropbox account.
  blogs: function (account_id) {
    return 'clients:dropbox:' + account_id;
  }

};