module.exports = function mkdir(client, path, callback) {
  client
    .filesCreateFolder({ path: path, autorename: true })
    .then(function(res) {
      if (!res) return callback(new Error("No response from Dropbox"));

      callback(null, res.path_display, res.id);
    })
    .catch(callback);
};
