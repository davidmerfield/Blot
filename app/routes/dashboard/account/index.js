var auth = require('authHandler');

module.exports = function (server) {

  server.get('/account', auth.enforce, function(request, response) {

    response.addLocals({title: 'Blot - Account'});

    response.addPartials({yield: 'dashboard/account'});

    response.render('dashboard/_account_wrapper');
  });

  require('./change-dropbox')(server);
  require('./close-blog')(server);
  require('./create-blog')(server);
  require('./cancel')(server);
  require('./disable-account')(server);
  require('./export')(server);
  require('./logout')(server);
  require('./pay-subscription')(server);
  require('./swap')(server);
  require('./thanks')(server);
  require('./try-blot')(server);
  require('./update-billing')(server);

}
