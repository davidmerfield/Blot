var helper = require('../helper');
var worker = helper.worker;
var script = __dirname + '/main';

module.exports = worker(script);