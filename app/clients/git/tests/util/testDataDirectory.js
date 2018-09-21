var testDataDirectory = __dirname + '/data';

require('fs-extra').ensureDirSync(testDataDirectory);

module.exports = testDataDirectory;