module.exports = function(server){

  require('./verify-domain')(server);
  require('./verify')(server);

};