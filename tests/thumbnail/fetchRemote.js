require('shelljs/global');

var download = require('../../scripts/remote/download');

var remote = '/var/www/Journal/tests/thumbnail/output.png';

var local = __dirname + '/remote-output.png';

download(remote, local, function(err){

  if (err) throw err;

  exec('open ' + local);

}, {silent: true});
