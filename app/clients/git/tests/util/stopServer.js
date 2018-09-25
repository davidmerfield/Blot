module.exports = function stopServer(done) {
  
  this.app.close(function(err) {
  
    if (err) return done(err);
  
    done();
  });
};
