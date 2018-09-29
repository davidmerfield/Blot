var sync = require("../index");

// The purpose of this code is to test the feature
// that sync will release any locks held by a particular
// process when the process dies. This process should die
// due to an error inside the sync function...
process.on('message', function(message){
  
  sync(message, function(error){

    throw new Error('Exception error simulation!');

  });
});