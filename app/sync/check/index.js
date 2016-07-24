var helper = require('../../helper');
var worker = helper.worker;
var script = __dirname + '/main';

// We only want to run this script
// once, when the sync process is started
module.exports = worker(script, {
  forever: false
});