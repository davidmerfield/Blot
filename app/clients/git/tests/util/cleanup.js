var dataDir = require('../../dataDir');
var fs = require('fs-extra');

module.exports = function (done) {

  // Each test creates a new bare repo in app/clients/git/data
  // Be careful cleaning this folder because it might contain
  // production data if the tests are accidentally run in prod.
  // In future it might be nice to pass a custom path to the 
  // git client when initializing it? That way we could just 
  // wipe the contents of this custom path at the end....
  fs.remove(dataDir + '/' + this.blog.handle + '.git', done);
}