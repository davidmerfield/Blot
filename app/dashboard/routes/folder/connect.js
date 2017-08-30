var Clients = require('clients');

module.exports = function(server){

  server.get('/folder/connect', function(req, res){

    res.locals.clients = Clients.list;

    res.renderDashboard('folder/connect', 'folder/wrapper');
  });
}