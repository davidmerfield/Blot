var helper =  require('../../app/helper');
var mkdirp = helper.mkdirp;
var HOST = require('./host');

var localRoot = helper.rootDir;
var remoteRoot = require('./root');

var dirname = require('path').dirname;
var basename = require('path').basename;

require('shelljs/global');

function inside (dir, root) {

  if (dir.indexOf(root) !== 0) {
    console.log('Root:', root);
    console.log('Dir:', dir);
    throw 'Directory is not inside the root';
  }
}

module.exports = function (remotePath, localPath, callback, options) {

  callback = callback || function(err) {console.log(err)};
  options = options || {};

  var progress = '--progress';

  var localDir = dirname(localPath);
  var localName = basename(localPath);

  var remoteDir = dirname(remotePath);
  var remoteName = basename(remotePath);

  var prettyRemote = remotePath.slice(remoteRoot.length);
  var prettyLocal = localPath.slice(localRoot.length);

  inside(localDir, localRoot);
  inside(remoteDir, remoteRoot);

  if (!options.silent)
    console.log('Downloading ', prettyRemote, 'to' , prettyLocal);

  mkdirp(localDir, function(err){

    if (err) throw err;

    exec('rsync -v ' + progress + ' -e ssh ' + HOST + ':' + remotePath + ' ' + localDir, options, function(code, stdout, stderr){

      if (code) return callback(code + stdout + stderr);

      if (localName === remoteName)
        return callback(null, stdout);

      exec('mv ' + localDir + '/' + remoteName + ' ' + localDir + '/' + localName, options, function(code, stdout, stderr){

        if (code) return callback(code + stdout + stderr);

        callback(null, stdout);
      });
    });
  });
};