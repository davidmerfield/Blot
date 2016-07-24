var options = require('minimist')(process.argv.slice(2));

options.mode = 'dev';

require('./main')(options, process.exit);