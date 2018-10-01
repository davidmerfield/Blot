module.exports = function(done) {
  var client = this.client;

  client
    .filesListFolder({
      path: "",
      recursive: true
    })
    .then(function(res) {
      return Promise.all(
        res.entries.map(function(entry) {
          return client.filesDelete({ path: entry.path_lower });
        })
      );
    })
    .then(function(res) {
      done();
    })
    .catch(function(err) {
      console.log(err);
      done(new Error(err.message));
    });
};
