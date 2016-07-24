var HOST = require('./host');

require('shelljs/global');

module.exports = function (command, callback) {

  exec('ssh ' + HOST + ' \"' + command + '\"', {silent:true}, function(code, stdout, stderr){

    if (code) return callback(code + stdout + stderr);

    return callback(null, stdout);
  });
};