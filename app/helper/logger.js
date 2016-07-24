var config = require('../../config');
var _ = require('lodash'),
    type = require('./type');

function logger (uid, action, subject) {

  var message = '';

  // {foo: 1, bar: 2, baz: 3} -> 'foo, bar, baz'
  // used to log updates made to a user
  if (type(subject) === 'object')
    subject = _.keys(subject).join(', ');

  if (uid)
    message += 'User: ' + uid + ' ';

  if (action)
    message += action + ' ';

  if (subject)
    message += subject;

  return console.log(message);
}

// expose a conditional logger if config wants it...
logger.debug = config.debug ? logger : function() {};

module.exports = logger;