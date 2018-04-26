var User = require('../../app/models/user');
var format = require('url').format;
var config = require('config');

if (require.main === module) {

  var email = process.argv[2];

  main(email, function(err, url){

    if (err) throw err;
    
    process.exit();
  });
}

function main (handle, callback) {

  User.generateAccessToken(email, function(err, token){

    if (err) throw err;

    // The full one-time log-in link to be sent to the user
    var url = format({
      protocol: 'https',
      host: config.host,
      pathname: '/sign-up',
      query: {
        already_paid: token
      }
    });

    console.log(url);
    callback();
  });
}

module.exports = main;