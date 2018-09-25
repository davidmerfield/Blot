var testDataDirectory = __dirname + '/data/' + global.blog.id;

require('fs-extra').ensureDirSync(testDataDirectory);

module.exports = testDataDirectory;