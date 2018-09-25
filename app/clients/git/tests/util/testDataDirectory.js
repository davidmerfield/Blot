module.exports = function (blogID){
  
  var testDataDirectory = __dirname + '/data/' + blogID;

  require('fs-extra').ensureDirSync(testDataDirectory);
  
  return testDataDirectory;
};