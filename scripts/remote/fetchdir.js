var helper =  require('../../app/helper');
var mkdirp = helper.mkdirp;

var localRoot = helper.rootDir;
var remoteRoot = require('./root');

require('shelljs/global');

function inside (dir, root) {

  if (dir.indexOf(root) !== 0) {
    console.log('Root:', root);
    console.log('Dir:', dir);
    throw 'Directory is not inside the root';
  }
}

module.exports = function (remotedir, localdir, callback) {

  inside(localdir, localRoot);
  inside(remotedir, remoteRoot);

  mkdirp(localdir, function(err){

    if (err) throw err;

    exec('rsync -avL --progress -e ssh blot:' + remotedir + '/* ' + localdir, function(code, stdout, stderr){

      if (code) return callback(code + stdout + stderr);

      callback(null, stdout);
    });
  });
};