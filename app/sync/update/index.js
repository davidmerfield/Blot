module.exports = function (blogID) {
  return function (path, callback) {
    console.log('Need to update', path);
    callback(null);
  };
};