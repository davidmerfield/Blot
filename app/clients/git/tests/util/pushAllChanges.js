module.exports = function(gitClient, callback) {
  gitClient.add(".", function(err) {
    if (err) return callback(new Error(err));

    gitClient.commit("initial", function(err) {
      if (err) return callback(new Error(err));

      gitClient.push(function(err) {
        if (err) return callback(new Error(err));

        callback(null);
      });
    });
  });
};
