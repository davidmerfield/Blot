module.exports = function(done) {
  var client = this.client;

  client
    .filesListFolder({
      path: "",
      recursive: true
    })
    .then(function(res) {
        console.log('Removing', res.entries.length, 'items...');
      return Promise.all(
        res.entries.map(function(entry) {
          return client.filesDelete({ path: entry.path_lower });
        })
      );
    })
    .then(function() {
      console.log('Emptied folder...');
      done();
    })
    .catch(function(err) {
      console.log('Failed to empty folder:', err.error.error_summary, err.retry_after);
      done(new Error('Could not empty folder'));
    });
};
