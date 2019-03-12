var email = process.argv[2];
var fs = require('fs');
if (!email) {
  console.log('Select an email to send:');
  fs.readdirSync(__dirname + '/../../app/helper/email/newsletters').forEach(function(letter){
    console.log('node scripts/email/newsletter', letter);
  });
}