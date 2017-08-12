var User = require('../../app/models/user');
var helper = require('../../app/helper');
var forEach = helper.forEach;
var ensure = helper.ensure;

module.exports = function (doThis, allDone, options) {

  options = options || {};

  ensure(doThis, 'function')
    .and(allDone, 'function')
    .and(options, 'object');

  User.getAllIds(function(uids){

    if (!uids) throw 'Nothing';

    if (options.s) {

      // options.s = parseInt(options.s);
      // console.log();
      // console.log();
      // console.log('Starting this script with blog which has ID', options.s);
      // console.log();
      // console.log();
      // blogIDs = blogIDs.slice(options.s - 1);

    }

    forEach(uids, function(uid, nextUser){

      User.getBy({uid: uid}, function(err, user){

        if (err || !user) throw err || 'No user';

        doThis(user, nextUser);

      });
    }, allDone);
  });
};