module.exports = function(gitClient, callback) {
  gitClient.add(".", function(err) {
    expect(err).toEqual(null);

    gitClient.commit("initial", function(err) {
      expect(err).toEqual(null);

      gitClient.push(function(err) {
        expect(err).toEqual(null);
        callback(null);
      });
    });
  });
};
