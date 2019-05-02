var config = require('../config');

if (config.environment !== 'development')
  throw 'This script must only be run locally.';

if (__dirname !== require('helper').rootDir + '/scripts')
  throw 'This script must only be run locally.';
