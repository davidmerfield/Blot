var dataDirectory = __dirname + '/data';

require('fs-extra').ensureDirSync(dataDirectory);

module.exports = dataDirectory;