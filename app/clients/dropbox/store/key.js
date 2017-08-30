module.exports = {
  info: function (blogID) {
    return 'blog:' + blogID + ':client:dropbox:info';
  },
  account: function(accountID) {
    return 'client:dropbox:account:' + accountID
  }
};