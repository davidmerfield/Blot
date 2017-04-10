var config = require('config');
var type = require('helper').type;

var INDEX = '/';
var CONTACT = '/contact';
var MAINTENANCE = '/maintenance';
var PAY_SUBSCRIPTION = '/account/pay-subscription';
var ENABLE = '/account/enable';
var LOGOUT = '/account/logout';
var DISABLED = '/account/disabled';

module.exports = function (req, res, next) {

  var user = req.user;

  function pathIs (path) {

    // We use indexOf instead of a simple comparison since
    // somethings we have a redirect query...
    if (type(path, 'string')) return req.originalUrl.indexOf(path) === 0;

    var paths = path;
    var match = false;

    paths.forEach(function(path){
      if (req.originalUrl.indexOf(path) === 0) match = true;
    });

    return match;
  }

  function pathIsNot (path) {
    return !pathIs(path);
  }

  // Don't expose any features which modify the database
  if (config.maintenance && pathIsNot([MAINTENANCE, CONTACT])) {
    return res.redirect(MAINTENANCE);
  }

  // Only serve the maintenance page if we are doing maintenance
  if (!config.maintenance && pathIs(MAINTENANCE)) {
    return res.redirect(INDEX);
  }

  // Only allow the user to pay
  if (user.needsToPay && pathIsNot([PAY_SUBSCRIPTION, CONTACT])) {
    return res.redirect(PAY_SUBSCRIPTION);
  }

  // Only let the user see these pages
  if (user.isDisabled && pathIsNot([ENABLE, LOGOUT, DISABLED, CONTACT])) {
    return res.redirect(DISABLED);
  }

  return next();
};