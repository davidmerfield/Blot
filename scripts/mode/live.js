var options = require('minimist')(process.argv.slice(2));

options.mode = 'live';

require('./main')(options, process.exit);