var _ = require('lodash');
var helper = require('../../helper');
var ensure = helper.ensure;
var forEach = helper.forEach.parallel;
var dirToModule = helper.dirToModule;
var dictionary = dirToModule(__dirname, require);

module.exports = function (req, retrieve, callback) {

  ensure(req, 'object')
    .and(retrieve, 'object')
    .and(callback, 'function');

  var locals = {};

  forEach(_.keys(retrieve), function(localName, nextLocal){

    if (dictionary[localName] === undefined) {
      console.log('No retrieve method to look up', localName);
      return nextLocal();
    }

    dictionary[localName](req, function(err, value){

      if (err)
        console.log(err);

      if (value !== undefined)
        locals[localName] = value;

      return nextLocal();
    });

  }, function(){

    callback(null, locals);
  });
};