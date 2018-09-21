module.exports = function stopServer(done) {
  global.app.close(function(err) {
    if (err) return done(err);

    delete global.app;
    done();
  });
};
